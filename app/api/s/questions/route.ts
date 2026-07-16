import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { askClaude, QA_SYSTEM } from '@/lib/claude';
import { markActivity } from '@/lib/data';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data } = await db().from('questions').select('*').eq('student_id', sess.id).eq('lang', getLang()).order('created_at', { ascending: false }).limit(100);
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { question } = await req.json().catch(() => ({}));
  if (!question || String(question).trim().length < 2) return NextResponse.json({ error: '질문을 입력해 주세요.' }, { status: 400 });

  let ai = '';
  try { ai = await askClaude(QA_SYSTEM(getLang()), [{ role: 'user', content: String(question) }], 800); }
  catch { ai = '(AI 즉답 실패 — 질문은 저장됐어요.)'; }

  const { data, error } = await db().from('questions')
    .insert({ student_id: sess.id, lang: getLang(), enrollment_id: null, question: String(question), ai_answer: ai })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await markActivity(sess.id);
  return NextResponse.json({ ok: true, item: data });
}

export async function PATCH(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, ask_teacher } = await req.json().catch(() => ({}));
  const { error } = await db().from('questions').update({ ask_teacher: !!ask_teacher }).eq('id', id).eq('student_id', sess.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
