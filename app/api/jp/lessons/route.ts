import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { askClaude, parseJSON, NOTE_SYSTEM } from '@/lib/claude';
import { initialDue } from '@/lib/srs';
import { todayStr } from '@/lib/dates';

export const maxDuration = 60; // 긴 전사도 여유 있게

type Note = {
  title: string;
  expressions: { jp: string; reading: string; ko: string; stuck: boolean }[];
  words: { word: string; reading: string; meaning: string }[];
  grammar: { point: string; explain: string; examples: string[] }[];
  confusions: string[];
};

// POST: 다글로 텍스트 붙여넣기 → 수업 노트 생성 (허브의 심장)
export async function POST(req: NextRequest) {
  const { raw } = await req.json().catch(() => ({}));
  if (!raw || String(raw).trim().length < 50) {
    return NextResponse.json({ error: '전사 텍스트가 너무 짧아요. 다글로에서 전체 텍스트를 복사해 붙여넣어 주세요.' }, { status: 400 });
  }

  let note: Note;
  try {
    const out = await askClaude(NOTE_SYSTEM, [{ role: 'user', content: String(raw).slice(0, 60000) }], 4000);
    note = parseJSON<Note>(out);
  } catch (e: any) {
    return NextResponse.json({ error: 'AI 분해에 실패했어요. 잠시 후 다시 시도해 주세요. (' + e.message + ')' }, { status: 502 });
  }

  const s = db();
  const today = todayStr();

  // 1) 수업 노트 저장
  const { data: lesson, error } = await s
    .from('jp_lessons')
    .insert({
      lesson_date: today,
      title: note.title || '수업',
      raw_text: String(raw),
      note: { expressions: note.expressions || [], grammar: note.grammar || [] },
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2) 단어 자동 적립 (중복은 무시)
  const words = (note.words || []).map((w) => ({
    lesson_id: lesson.id,
    word: w.word,
    reading: w.reading || '',
    meaning: w.meaning || '',
    stage: 0,
    next_due: initialDue(),
  }));
  if (words.length) await s.from('jp_words').upsert(words, { onConflict: 'word,meaning', ignoreDuplicates: true });

  // 3) 헷갈림 축적 — 비슷한 게 이미 있으면 count+1 (반복 등장 = ⭐)
  for (const c of note.confusions || []) {
    const { data: existing } = await s
      .from('jp_confusions')
      .select('id, count')
      .eq('resolved', false)
      .ilike('text', `%${c.slice(0, 12)}%`)
      .limit(1);
    if (existing && existing.length) {
      await s.from('jp_confusions').update({ count: existing[0].count + 1, last_seen: today, lesson_id: lesson.id }).eq('id', existing[0].id);
    } else {
      await s.from('jp_confusions').insert({ lesson_id: lesson.id, text: c, last_seen: today });
    }
  }

  // 4) 활동 기록 (스트릭)
  await s.from('jp_activity').upsert({ day: today }, { onConflict: 'day', ignoreDuplicates: true });

  return NextResponse.json({ ok: true, id: lesson.id, counts: { expressions: note.expressions?.length || 0, words: words.length, confusions: note.confusions?.length || 0 } });
}
