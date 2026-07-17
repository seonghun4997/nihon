import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { askClaude, parseJSON, MEDIA_REC_SYSTEM, MEDIA_CATCH_SYSTEM } from '@/lib/claude';
import { getLang } from '@/lib/lang';
import { prefOf } from '@/lib/prefs';
import { initialDue } from '@/lib/srs';
import { todayStr } from '@/lib/dates';
import { markActivity } from '@/lib/data';
import { forceKoreanReading } from '@/lib/kana2ko';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const sess = getSession();
  if (!sess) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const lang0 = getLang();
  const { data } = await db().from('media_recs').select('*')
    .eq('student_id', sess.id).eq('lang', lang0)
    .order('created_at', { ascending: false }).limit(10);
  const items = (data || []).map((r) => ({
    ...r,
    expressions: (r.expressions || []).map((e: any) => forceKoreanReading(e, lang0)),
  }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const lang = getLang();
  const s = db();

  // ── 작품 추천 ──
  if (body.action === 'recommend') {
    const { goal } = await prefOf(lang);
    const { data: prev } = await s.from('media_recs').select('title')
      .eq('student_id', sess.id).eq('lang', lang).order('created_at', { ascending: false }).limit(20);
    const exclude = (prev || []).map((p) => p.title);
    try {
      const out = await askClaude(MEDIA_REC_SYSTEM(lang, goal, exclude), [{ role: 'user', content: '오늘의 추천 1개' }], 1500);
      const rec = parseJSON<any>(out);
      rec.expressions = (rec.expressions || []).map((e: any) => forceKoreanReading(e, lang));
      const { data, error } = await s.from('media_recs').insert({
        student_id: sess.id, lang, title: rec.title || '', kind: rec.kind || '',
        why: rec.why || '', how: rec.how || '', expressions: rec.expressions || [],
      }).select().single();
      if (error || !data) return NextResponse.json({ error: '저장 실패: ' + (error?.message || 'unknown') }, { status: 500 });
      return NextResponse.json({ ok: true, item: data });
    } catch (e: any) {
      return NextResponse.json({ error: '추천 생성 실패 — 다시 시도해 주세요.' }, { status: 502 });
    }
  }

  // ── 추천 표현 → 복습 큐 담기 ──
  if (body.action === 'save') {
    const exprs: any[] = Array.isArray(body.expressions) ? body.expressions.slice(0, 10) : [];
    if (!exprs.length) return NextResponse.json({ error: '담을 표현이 없어요.' }, { status: 400 });
    const rows = exprs.map((e) => ({
      student_id: sess.id, lang, text: String(e.jp || '').slice(0, 300),
      reading: String(e.reading || ''), ko: String(e.ko || ''), stage: 0, next_due: todayStr(), // 담자마자 바로 연습 가능
    })).filter((r) => r.text);
    await s.from('speaks').upsert(rows, { onConflict: 'student_id,lang,text', ignoreDuplicates: true });
    await markActivity(sess.id);
    return NextResponse.json({ ok: true, saved: rows.length });
  }

  // ── 보다가 건진 문장 분해 ──
  if (body.action === 'catch') {
    const text = String(body.text || '').trim().slice(0, 2000);
    if (text.length < 2) return NextResponse.json({ error: '건진 문장을 붙여넣어 주세요.' }, { status: 400 });
    try {
      const out = await askClaude(MEDIA_CATCH_SYSTEM(lang), [{ role: 'user', content: text }], 2000);
      const parsed = parseJSON<{ items: any[] }>(out);
      const items = (parsed.items || []).slice(0, 10).map((e: any) => forceKoreanReading(e, lang));
      const rows = items.map((e) => ({
        student_id: sess.id, lang, text: String(e.jp || '').slice(0, 300),
        reading: String(e.reading || ''), ko: String(e.ko || ''), stage: 0, next_due: todayStr(), // 담자마자 바로 연습 가능
      })).filter((r) => r.text);
      if (rows.length) await s.from('speaks').upsert(rows, { onConflict: 'student_id,lang,text', ignoreDuplicates: true });
      await markActivity(sess.id);
      return NextResponse.json({ ok: true, items, saved: rows.length });
    } catch {
      return NextResponse.json({ error: '분해 실패 — 다시 시도해 주세요.' }, { status: 502 });
    }
  }

  return NextResponse.json({ error: 'bad action' }, { status: 400 });
}
