import { db } from './supabase';
import { askClaude, parseJSON, TOPIC_SYSTEM } from './claude';

export type TopicSet = {
  topics: { jp: string; ko: string; expressions: { jp: string; reading: string; ko: string }[]; reuse: string[] }[];
};

async function buildContext(studentId: string) {
  const { data: lessons } = await db()
    .from('lessons')
    .select('lesson_date, title, note, raw_text')
    .eq('student_id', studentId)
    .order('lesson_date', { ascending: false })
    .limit(3);
  if (!lessons?.length) return null;
  return lessons
    .map((l) => {
      const exprs = (l.note?.expressions || []).slice(0, 10).map((e: any) => `- ${e.jp} (${e.ko})`).join('\n');
      return `[${l.lesson_date}] ${l.title}\n표현:\n${exprs}\n전사 발췌: ${String(l.raw_text).slice(0, 800)}`;
    })
    .join('\n\n');
}

export async function generateTopicsFor(studentId: string, forDate: string) {
  const s = db();
  const { data: existing } = await s.from('topics').select('*').eq('student_id', studentId).eq('for_date', forDate).maybeSingle();
  if (existing) return existing;
  const ctx = await buildContext(studentId);
  if (!ctx) return null;
  const out = await askClaude(TOPIC_SYSTEM, [{ role: 'user', content: ctx }], 3000);
  const parsed = parseJSON<TopicSet>(out);
  const { data } = await s
    .from('topics')
    .upsert({ student_id: studentId, for_date: forDate, topics: parsed.topics }, { onConflict: 'student_id,for_date' })
    .select()
    .single();
  return data;
}
