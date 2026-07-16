import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { askClaude, parseJSON, NOTE_SYSTEM } from '@/lib/claude';
import { initialDue } from '@/lib/srs';
import { todayStr } from '@/lib/dates';
import { activeEnrollmentOf, markActivity } from '@/lib/data';

export const maxDuration = 60;

type Note = {
  title: string;
  expressions: { jp: string; reading: string; ko: string; stuck: boolean }[];
  words: { word: string; reading: string; meaning: string }[];
  grammar: { point: string; explain: string; examples: string[] }[];
  confusions: string[];
};

// POST: 다글로 텍스트 → 수업 노트 자동 생성 + 출석 자동 기록 (정산의 원천)
export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { raw } = await req.json().catch(() => ({}));
  if (!raw || String(raw).trim().length < 50) {
    return NextResponse.json({ error: '전사 텍스트가 너무 짧아요. 다글로에서 전체 텍스트를 복사해 주세요.' }, { status: 400 });
  }

  let note: Note;
  try {
    const out = await askClaude(NOTE_SYSTEM, [{ role: 'user', content: String(raw).slice(0, 60000) }], 4000);
    note = parseJSON<Note>(out);
  } catch (e: any) {
    return NextResponse.json({ error: 'AI 분해 실패 — 잠시 후 다시 시도해 주세요. (' + e.message + ')' }, { status: 502 });
  }

  const s = db();
  const today = todayStr();
  const enr = await activeEnrollmentOf(sess.id);

  const { data: lesson, error } = await s
    .from('lessons')
    .insert({
      enrollment_id: enr?.id || null,
      student_id: sess.id,
      teacher_id: enr?.teacher_id || null,
      lesson_date: today,
      title: note.title || '수업',
      raw_text: String(raw),
      note: { expressions: note.expressions || [], grammar: note.grammar || [] },
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const words = (note.words || []).map((w) => ({
    student_id: sess.id,
    lesson_id: lesson.id,
    word: w.word, reading: w.reading || '', meaning: w.meaning || '',
    stage: 0, next_due: initialDue(),
  }));
  if (words.length) await s.from('words').upsert(words, { onConflict: 'student_id,word,meaning', ignoreDuplicates: true });

  for (const c of note.confusions || []) {
    const { data: ex } = await s.from('confusions').select('id, count')
      .eq('student_id', sess.id).eq('resolved', false).ilike('text', `%${c.slice(0, 12)}%`).limit(1);
    if (ex?.length) await s.from('confusions').update({ count: ex[0].count + 1, last_seen: today, lesson_id: lesson.id }).eq('id', ex[0].id);
    else await s.from('confusions').insert({ student_id: sess.id, lesson_id: lesson.id, text: c, last_seen: today });
  }

  // 출석 자동 기록 → 월말 정산의 원천
  if (enr?.id) await s.from('attendances').insert({ enrollment_id: enr.id, att_date: today, source: 'auto', lesson_id: lesson.id });
  await markActivity(sess.id);

  return NextResponse.json({ ok: true, id: lesson.id });
}
