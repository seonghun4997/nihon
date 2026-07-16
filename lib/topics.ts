import { db } from './supabase';
import { askClaude, parseJSON, TOPIC_SYSTEM } from './claude';

export type TopicSet = {
  topics: { jp: string; ko: string; expressions: { jp: string; reading: string; ko: string }[]; reuse: string[] }[];
};

async function buildContext() {
  const s = db();
  const { data: lessons } = await s
    .from('jp_lessons')
    .select('lesson_date, title, note, raw_text')
    .order('lesson_date', { ascending: false })
    .limit(3);
  if (!lessons || !lessons.length) return null;
  return lessons
    .map((l) => {
      const exprs = (l.note?.expressions || []).slice(0, 10).map((e: any) => `- ${e.jp} (${e.ko})`).join('\n');
      return `[${l.lesson_date}] ${l.title}\n표현:\n${exprs}\n전사 발췌: ${String(l.raw_text).slice(0, 800)}`;
    })
    .join('\n\n');
}

/** 특정 수업일용 주제 카드 — 없으면 생성, 있으면 반환 */
export async function generateTopicsFor(forDate: string) {
  const s = db();
  const { data: existing } = await s.from('jp_topics').select('*').eq('for_date', forDate).maybeSingle();
  if (existing) return existing;

  const ctx = await buildContext();
  if (!ctx) return null;

  const out = await askClaude(TOPIC_SYSTEM, [{ role: 'user', content: ctx }], 3000);
  const parsed = parseJSON<TopicSet>(out);
  const { data } = await s
    .from('jp_topics')
    .upsert({ for_date: forDate, topics: parsed.topics }, { onConflict: 'for_date' })
    .select()
    .single();
  return data;
}
