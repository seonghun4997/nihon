import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { todayStr } from '@/lib/dates';

// 노트 없이 진행된 수업 수동 +1 / 잘못 찍힌 출석 삭제
export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'teacher') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { enrollment_id, att_date } = await req.json().catch(() => ({}));
  const s = db();
  const { data: enr } = await s.from('enrollments').select('id, teacher_id').eq('id', enrollment_id).maybeSingle();
  if (!enr || enr.teacher_id !== sess.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { error } = await s.from('attendances').insert({ enrollment_id: enr.id, att_date: att_date || todayStr(), source: 'manual' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'teacher') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const s = db();
  const { data: att } = await s.from('attendances').select('id, enrollments!inner(teacher_id)').eq('id', id).maybeSingle();
  if (!att || (att as any).enrollments?.teacher_id !== sess.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await s.from('attendances').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
