import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { askClaude, parseJSON, NOTE_SYSTEM } from '@/lib/claude';
import { initialDue } from '@/lib/srs';
import { todayStr } from '@/lib/dates';
import { markActivity } from '@/lib/data';
import { getLang } from '@/lib/lang';
import { prefOf } from '@/lib/prefs';
import { forceKoreanReading } from '@/lib/kana2ko';

export const maxDuration = 60;

type Note = {
  title: string;
  expressions: { jp: string; reading: string; ko: string; stuck: boolean }[];
  words: { word: string; reading: string; meaning: string }[];
  grammar: { point: string; explain: string; examples: string[] }[];
  confusions: string[];
};

// POST: 다글로 텍스트 → 수업 노트 자동 생성 + 출석 자동 기록 (정산의 원천)
export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { raw } = await req.json().catch(() => ({}));
  const lang = getLang();
  if (!raw || String(raw).trim().length < 50) {
    return NextResponse.json({ error: '전사 텍스트가 너무 짧아요. 다글로에서 전체 텍스트를 복사해 주세요.' }, { status: 400 });
  }

  const { goal } = await prefOf(lang);
  let note: Note;
  try {
    const out = await askClaude(NOTE_SYSTEM(lang, goal), [{ role: 'user', content: String(raw).slice(0, 60000) }], 4000);
    note = parseJSON<Note>(out);
    note.expressions = (note.expressions || []).map((e) => forceKoreanReading(e, lang));
    note.words = (note.words || []).map((w) => forceKoreanReading(w, lang));
  } catch (e: any) {
    return NextResponse.json({ error: 'AI 분해 실패 — 잠시 후 다시 시도해 주세요. (' + e.message + ')' }, { status: 502 });
  }

  const s = db();
  const today = todayStr();
  const enr = null as any;

  const { data: lesson, error } = await s
    .from('lessons')
    .insert({
      enrollment_id: null,
      student_id: sess.id,
      teacher_id: null,
      lesson_date: today,
      lang,
      title: note.title || '수업',
      raw_text: String(raw),
      note: { expressions: note.expressions || [], grammar: note.grammar || [] },
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const words = (note.words || []).map((w) => ({
    student_id: sess.id,
    lang,
    lesson_id: lesson.id,
    word: w.word, reading: w.reading || '', meaning: w.meaning || '',
    stage: 0, next_due: todayStr(), // 수업 직후 바로 입으로
  }));
  if (words.length) await s.from('words').upsert(words, { onConflict: 'student_id,word,meaning', ignoreDuplicates: true });

  // 집요 복습: 말하려다 막힌 표현 → 말하기 테스트 큐(SRS)에 적립
  const speaks = (note.expressions || []).filter((e) => e.stuck).map((e) => ({
    student_id: sess.id, lang, text: e.jp, reading: e.reading || '', ko: e.ko || '',
    stage: 0, next_due: todayStr(), // 수업 직후 바로 입으로
  }));
  if (speaks.length) await s.from('speaks').upsert(speaks, { onConflict: 'student_id,lang,text', ignoreDuplicates: true });

  for (const c of note.confusions || []) {
    const { data: ex } = await s.from('confusions').select('id, count')
      .eq('student_id', sess.id).eq('resolved', false).ilike('text', `%${c.slice(0, 12)}%`).limit(1);
    if (ex?.length) await s.from('confusions').update({ count: ex[0].count + 1, last_seen: today, lesson_id: lesson.id }).eq('id', ex[0].id);
    else await s.from('confusions').insert({ student_id: sess.id, lang, lesson_id: lesson.id, text: c, last_seen: today });
  }

  await markActivity(sess.id);

  return NextResponse.json({ ok: true, id: lesson.id });
}
