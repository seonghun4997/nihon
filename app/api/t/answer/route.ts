import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// 선생님이 학생 질문에 답변 (맥락 채팅 v1)
export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || (sess.role !== 'teacher' && sess.role !== 'owner')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, answer } = await req.json().catch(() => ({}));
  if (!answer?.trim()) return NextResponse.json({ error: '답변을 입력해 주세요.' }, { status: 400 });

  const s = db();
  // 내 학생의 질문인지 확인
  const { data: q } = await s.from('questions').select('id, enrollment_id, enrollments!inner(teacher_id)').eq('id', id).maybeSingle();
  if (!q || (q as any).enrollments?.teacher_id !== sess.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { error } = await s.from('questions').update({ teacher_answer: String(answer).trim(), answered_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
