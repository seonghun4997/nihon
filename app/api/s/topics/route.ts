import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { generateTopicsFor } from '@/lib/topics';
import { addDaysStr, todayStr } from '@/lib/dates';
import { getLang } from '@/lib/lang';
import { initialDue } from '@/lib/srs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const forDate = req.nextUrl.searchParams.get('for') || todayStr();
  const reroll = req.nextUrl.searchParams.get('reroll') === '1';
  try {
    if (reroll) await db().from('topics').delete().eq('student_id', sess.id).eq('lang', getLang()).eq('for_date', forDate);
    const row = await generateTopicsFor(sess.id, forDate, getLang());
    if (!row) return NextResponse.json({ empty: true, reason: '주제 생성에 실패했어요 — 다시 시도해 주세요.' });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: '주제 생성 실패: ' + e.message }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { for_date, selected } = await req.json().catch(() => ({}));
  const lang = getLang();
  const s = db();
  const { data: row, error } = await s.from('topics').update({ selected })
    .eq('student_id', sess.id).eq('lang', lang).eq('for_date', for_date).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 주제를 고르면 예습 노트가 저절로 생김 (수업 전에도 루프 시동)
  const t = row?.topics?.[selected];
  let noteId: string | null = null;
  let speakCount = 0;
  if (t) {
    const title = `예습 · ${t.jp}`;
    const { data: exists } = await s.from('lessons').select('id').eq('student_id', sess.id).eq('lang', lang)
      .eq('lesson_date', for_date).eq('title', title).maybeSingle();
    if (exists) {
      noteId = exists.id;
    } else {
      const { data: created } = await s.from('lessons').insert({
        student_id: sess.id, lang, lesson_date: for_date, title,
        raw_text: '(주제 카드에서 자동 생성된 예습 노트)',
        note: { expressions: (t.expressions || []).map((e: any) => ({ ...e, stuck: false })), grammar: [] },
      }).select('id').single();
      noteId = created?.id || null;
    }
    const speaks = (t.expressions || []).slice(0, 5).map((e: any) => ({
      student_id: sess.id, lang, text: String(e.jp || '').slice(0, 300),
      reading: String(e.reading || ''), ko: String(e.ko || ''), stage: 0, next_due: todayStr(), // 고르자마자 바로 연습 가능
    })).filter((r: any) => r.text);
    speakCount = speaks.length;
    if (speaks.length) await s.from('speaks').upsert(speaks, { onConflict: 'student_id,lang,text', ignoreDuplicates: true });
  }
  return NextResponse.json({ ok: true, prepared: !!t, note_id: noteId, speak_count: speakCount });
}
