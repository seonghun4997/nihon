import { addDaysStr, todayStr } from './dates';

// 간격 반복: stage 0→D1, 1→D3, 2→D7, 3→D21, 4→졸업(은퇴)
export const INTERVALS = [1, 3, 7, 21];

export function nextAfterCorrect(stage: number): { stage: number; nextDue: string | null; retired: boolean } {
  const s = stage + 1;
  if (s >= INTERVALS.length) return { stage: s, nextDue: null, retired: true };
  return { stage: s, nextDue: addDaysStr(todayStr(), INTERVALS[s]), retired: false };
}

export function nextAfterWrong(): { stage: number; nextDue: string; retired: boolean } {
  // 틀리면 처음으로 — 내일 다시
  return { stage: 0, nextDue: addDaysStr(todayStr(), 1), retired: false };
}

export function initialDue(): string {
  return addDaysStr(todayStr(), 1); // 새 단어는 D1부터
}
