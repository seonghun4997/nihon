import { db } from './supabase';
import type { Lang } from './claude';

export const DEFAULT_GOAL = '여행 가서 막힘없이 일상 대화';

export async function prefOf(lang: Lang): Promise<{ weekdays: number[]; goal: string }> {
  const { data } = await db().from('jp_prefs').select('*').eq('lang', lang).maybeSingle();
  return {
    weekdays: Array.isArray(data?.weekdays) ? data!.weekdays : [],
    goal: (data as any)?.goal || DEFAULT_GOAL,
  };
}
