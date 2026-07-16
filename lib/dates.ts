// 서버는 UTC로 돌 수 있으므로 항상 KST 기준으로 계산
const KST_OFFSET = 9 * 60 * 60 * 1000;

export function nowKST(): Date {
  return new Date(Date.now() + KST_OFFSET);
}

/** YYYY-MM-DD (KST) */
export function todayStr(): string {
  return nowKST().toISOString().slice(0, 10);
}

export function addDaysStr(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0=일 ... 2=화 ... 5=금 (KST) */
export function dayOfWeekKST(): number {
  return nowKST().getUTCDay();
}

export const LESSON_DAYS = [2, 5]; // 화 · 금

export function isLessonDay(): boolean {
  return LESSON_DAYS.includes(dayOfWeekKST());
}

/** 내일이 수업일인가 (전날 밤 주제 카드용) */
export function isDayBeforeLesson(): boolean {
  return LESSON_DAYS.includes((dayOfWeekKST() + 1) % 7);
}

/** 어제가 수업일이었나 (이어하기 회화 제안용) */
export function isDayAfterLesson(): boolean {
  return LESSON_DAYS.includes((dayOfWeekKST() + 6) % 7);
}

export function formatKo(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${days[d.getUTCDay()]})`;
}
