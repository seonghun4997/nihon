import { db } from './supabase';
import { addDaysStr, todayStr } from './dates';

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
