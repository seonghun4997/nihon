import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { askClaude, BRIEFING_SYSTEM } from '@/lib/claude';
import { todayStr } from '@/lib/dates';
import { reviewRate7d } from '@/lib/data';

export const maxDuration = 60;

// 수업 브리핑 생성 — "준비 0분"의 실체
export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'teacher') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { enrollment_id } = await req.json().catch(() => ({}));
  const s = db();
  const today = todayStr();

  const { data: enr } = await s.from('enrollments').select('*, student:student_id(id, name)').eq('id', enrollment_id).maybeSingle();
  if (!enr || enr.teacher_id !== sess.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: cached } = await s.from('briefings').select('*').eq('enrollment_id', enr.id).eq('for_date', today).maybeSingle();
  if (cached) return NextResponse.json({ ok: true, content: cached.content, cached: true });

  const sid = (enr as any).student.id;
  const [{ data: lastLesson }, { data: topic }, { data: qs }, { data: confs }, rate] = await Promise.all([
    s.from('lessons').select('lesson_date, title, note').eq('student_id', sid).order('lesson_date', { ascending: false }).limit(1).maybeSingle(),
    s.from('topics').select('*').eq('student_id', sid).eq('for_date', today).maybeSingle(),
    s.from('questions').select('question').eq('student_id', sid).eq('ask_teacher', true).is('answered_at', null).limit(5),
    s.from('confusions').select('text, count').eq('student_id', sid).eq('resolved', false).gte('count', 2).order('count', { ascending: false }).limit(3),
    reviewRate7d(sid),
  ]);

  const picked = topic?.selected != null ? (topic.topics || [])[topic.selected] : null;
  const material = [
    `학생: ${(enr as any).student.name}`,
    lastLesson ? `지난 수업(${lastLesson.lesson_date}) "${lastLesson.title}" 표현: ${(lastLesson.note?.expressions || []).slice(0, 8).map((e: any) => e.jp).join(' / ')}` : '지난 수업 기록 없음 (첫 수업)',
    picked ? `학생이 고른 오늘 주제: ${picked.jp} — ${picked.ko}` : '학생이 고른 주제 없음',
    `물어볼 질문: ${(qs || []).map((q) => q.question).join(' | ') || '없음'}`,
    `반복 헷갈림: ${(confs || []).map((c) => `${c.text}(${c.count}회)`).join(' | ') || '없음'}`,
    `최근 7일 복습률: ${rate}%`,
  ].join('\n');

  let content = material;
  try { content = await askClaude(BRIEFING_SYSTEM, [{ role: 'user', content: material }], 900); } catch {}

  await s.from('briefings').upsert({ enrollment_id: enr.id, for_date: today, content });
  return NextResponse.json({ ok: true, content });
}
