import { db } from './supabase';
import { addDaysStr, todayStr } from './dates';

/** 연속 N일 — 오늘 안 했으면 어제까지 이어진 것도 인정 */
export async function getStreak(): Promise<number> {
  const s = db();
  const { data } = await s.from('jp_activity').select('day').order('day', { ascending: false }).limit(120);
  if (!data || !data.length) return 0;
  const days = new Set(data.map((d) => String(d.day)));
  let cursor = todayStr();
  if (!days.has(cursor)) cursor = addDaysStr(cursor, -1); // 오늘 아직 안 했으면 어제부터
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDaysStr(cursor, -1);
  }
  return streak;
}
