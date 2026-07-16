import { db } from './supabase';
import { addDaysStr, todayStr, Slot } from './dates';

// ── 공용 조회 헬퍼 (서버 컴포넌트/API 공용) ──

export async function getUser(id: string) {
  const { data } = await db().from('users').select('id, email, name, phone, role, approved').eq('id', id).maybeSingle();
  return data;
}

/** 학생의 활성 수강 (N1: 선생님 1명 가정) */
export async function activeEnrollmentOf(studentId: string) {
  const { data } = await db()
    .from('enrollments')
    .select('*, teacher:teacher_id(id, name)')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  return data as any;
}

export async function teacherEnrollments(teacherId: string) {
  const { data } = await db()
    .from('enrollments')
    .select('*, student:student_id(id, name, phone, email)')
    .eq('teacher_id', teacherId)
    .neq('status', 'ended')
    .order('created_at');
  return (data || []) as any[];
}

/** 최근 7일 활동일수 → 복습률 % */
export async function reviewRate7d(studentId: string): Promise<number> {
  const from = addDaysStr(todayStr(), -6);
  const { count } = await db()
    .from('activity')
    .select('day', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .gte('day', from);
  return Math.round(((count || 0) / 7) * 100);
}

export async function streakOf(studentId: string): Promise<number> {
  const { data } = await db().from('activity').select('day').eq('student_id', studentId).order('day', { ascending: false }).limit(120);
  if (!data?.length) return 0;
  const days = new Set(data.map((d) => String(d.day)));
  let cursor = todayStr();
  if (!days.has(cursor)) cursor = addDaysStr(cursor, -1);
  let n = 0;
  while (days.has(cursor)) { n++; cursor = addDaysStr(cursor, -1); }
  return n;
}

export async function markActivity(studentId: string) {
  await db().from('activity').upsert({ student_id: studentId, day: todayStr() }, { onConflict: 'student_id,day', ignoreDuplicates: true });
}

export function parseSlots(raw: any): Slot[] {
  return Array.isArray(raw) ? raw : [];
}
