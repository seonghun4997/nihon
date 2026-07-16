import { db } from './supabase';
import { askClaude, parseJSON, TOPIC_SYSTEM, Lang } from './claude';
import { prefOf } from './prefs';

export type TopicSet = {
  topics: { jp: string; ko: string; expressions: { jp: string; reading: string; ko: string }[]; reuse: string[] }[];
};

async function buildContext(studentId: string, lang: Lang) {
  const { data: lessons } = await db()
    .from('lessons')
    .select('lesson_date, title, note, raw_text')
    .eq('student_id', studentId)
    .eq('lang', lang)
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

export async function generateTopicsFor(studentId: string, forDate: string, lang: Lang) {
  const s = db();
  const { data: existing } = await s.from('topics').select('*').eq('student_id', studentId).eq('lang', lang).eq('for_date', forDate).maybeSingle();
  if (existing) return existing;
  const { goal } = await prefOf(lang);
  const ctx = (await buildContext(studentId, lang))
    || `아직 수업 기록이 없습니다 (첫 수업 준비). 학습자 목표 "${goal}"와 초중급 레벨에 맞춰, 첫 회화 수업에서 다루기 좋은 주제 3개를 만들어 주세요.`;
  const out = await askClaude(TOPIC_SYSTEM(lang, goal), [{ role: 'user', content: ctx }], 3000);
  const parsed = parseJSON<TopicSet>(out);
  const { data } = await s
    .from('topics')
    .upsert({ student_id: studentId, lang, for_date: forDate, topics: parsed.topics }, { onConflict: 'student_id,lang,for_date' })
    .select()
    .single();
  return data;
}
