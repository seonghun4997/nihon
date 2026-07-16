import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// 복습 체크 리액션 — 선생님 1탭 응원 (비용 최소 × 학생 동기 최대)
export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'teacher') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { enrollment_id, emoji } = await req.json().catch(() => ({}));
  const s = db();
  const { data: enr } = await s.from('enrollments').select('id, student_id, teacher_id').eq('id', enrollment_id).maybeSingle();
  if (!enr || enr.teacher_id !== sess.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await s.from('reactions').insert({ enrollment_id: enr.id, student_id: enr.student_id, teacher_id: sess.id, emoji: emoji || '👏' });
  return NextResponse.json({ ok: true });
}
