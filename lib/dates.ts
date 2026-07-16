// 항상 KST 기준
const KST = 9 * 60 * 60 * 1000;
export function nowKST(): Date { return new Date(Date.now() + KST); }
export function todayStr(): string { return nowKST().toISOString().slice(0, 10); }
export function addDaysStr(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function dayOfWeekKST(): number { return nowKST().getUTCDay(); } // 0=일
export function monthStr(): string { return nowKST().toISOString().slice(0, 7); } // YYYY-MM
export function formatKo(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const days = ['일','월','화','수','목','금','토'];
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${days[d.getUTCDay()]})`;
}
export const DAY_KO = ['일','월','화','수','목','금','토'];

// ── 슬롯 유틸 (enrollments.slots 기반 — 하드코딩 화·금의 일반화) ──
export type Slot = { weekday: number; time: string; mode: 'online' | 'offline'; place?: string };
export function slotDaysOf(slots: Slot[]): number[] { return Array.from(new Set((slots || []).map(s => s.weekday))); }
export function isLessonDayFor(slots: Slot[]): boolean { return slotDaysOf(slots).includes(dayOfWeekKST()); }
export function isDayBeforeLessonFor(slots: Slot[]): boolean { return slotDaysOf(slots).includes((dayOfWeekKST() + 1) % 7); }
export function isDayAfterLessonFor(slots: Slot[]): boolean { return slotDaysOf(slots).includes((dayOfWeekKST() + 6) % 7); }
export function nextLessonDateFor(slots: Slot[]): string | null {
  const days = slotDaysOf(slots);
  if (!days.length) return null;
  for (let i = 0; i <= 7; i++) {
    const d = (dayOfWeekKST() + i) % 7;
    if (days.includes(d)) return addDaysStr(todayStr(), i);
  }
  return null;
}
export function slotLabel(s: Slot): string {
  return `매주 ${DAY_KO[s.weekday]} ${s.time} · ${s.mode === 'online' ? '비대면' : '대면'}${s.place ? ' · ' + s.place : ''}`;
}
