import { isAuthed } from '@/lib/guard';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { askClaude, QA_SYSTEM } from '@/lib/claude';
import { todayStr } from '@/lib/dates';

export const maxDuration = 30;

// POST: 질문 휙 저장 → AI 즉답
export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { question } = await req.json().catch(() => ({}));
  if (!question || String(question).trim().length < 2) {
    return NextResponse.json({ error: '질문을 입력해 주세요.' }, { status: 400 });
  }

  let answer = '';
  try {
    answer = await askClaude(QA_SYSTEM, [{ role: 'user', content: String(question) }], 800);
  } catch {
    answer = '(AI 즉답 실패 — 질문은 저장됐어요. 나중에 다시 열어보세요.)';
  }

  const s = db();
  const { data, error } = await s.from('jp_questions').insert({ question: String(question), answer }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await s.from('jp_activity').upsert({ day: todayStr() }, { onConflict: 'day', ignoreDuplicates: true });
  return NextResponse.json({ ok: true, item: data });
}

// PATCH: [다음 수업 때 물어보기] 토글
export async function PATCH(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, ask_teacher } = await req.json().catch(() => ({}));
  const s = db();
  const { error } = await s.from('jp_questions').update({ ask_teacher: !!ask_teacher }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
