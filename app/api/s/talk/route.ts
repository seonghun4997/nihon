import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { askClaude, TALK_SYSTEM } from '@/lib/claude';
import { todayStr } from '@/lib/dates';
import { markActivity } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function lessonContext(studentId: string) {
  const { data: lesson } = await db().from('lessons').select('id, title, note')
    .eq('student_id', studentId).order('lesson_date', { ascending: false }).limit(1).maybeSingle();
  if (!lesson) return { lessonId: null as string | null, context: '', expressions: [] as string[] };
  const exprs: { jp: string; ko: string }[] = lesson.note?.expressions || [];
  return {
    lessonId: lesson.id as string,
    context: `주제: ${lesson.title}\n배운 표현:\n` + exprs.map((e) => `- ${e.jp} (${e.ko})`).join('\n'),
    expressions: exprs.map((e) => e.jp),
  };
}

export async function GET() {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = db();
  const today = todayStr();
  const { data: existing } = await s.from('talks').select('*').eq('student_id', sess.id).eq('talk_date', today).maybeSingle();
  if (existing) return NextResponse.json(existing);

  const { lessonId, context } = await lessonContext(sess.id);
  if (!lessonId) return NextResponse.json({ empty: true, reason: '수업 노트가 아직 없어요. 첫 수업을 붙여넣으면 이어하기가 열립니다.' });

  let opener = 'こんにちは！最近どうですか？\n(힌트: 元気です / ちょっと忙しいです 로 답해보세요)';
  try { opener = await askClaude(TALK_SYSTEM(context), [{ role: 'user', content: '대화를 시작해 주세요. 수업 주제를 이어가는 가벼운 질문 하나로.' }], 400); } catch {}

  const { data } = await s.from('talks')
    .insert({ student_id: sess.id, talk_date: today, lesson_id: lessonId, messages: [{ role: 'assistant', content: opener }], turns: 0 })
    .select().single();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { text } = await req.json().catch(() => ({}));
  if (!text || !String(text).trim()) return NextResponse.json({ error: '내용을 입력해 주세요.' }, { status: 400 });

  const s = db();
  const today = todayStr();
  const { data: talk } = await s.from('talks').select('*').eq('student_id', sess.id).eq('talk_date', today).maybeSingle();
  if (!talk) return NextResponse.json({ error: '세션이 없어요. 새로고침해 주세요.' }, { status: 404 });

  const { context, expressions } = await lessonContext(sess.id);
  const reused = expressions.filter((jp) => {
    const core = jp.replace(/[。、！？\s]/g, '');
    for (let i = 0; i + 4 <= core.length; i++) if (String(text).includes(core.slice(i, i + 4))) return true;
    return false;
  });

  const history = [...(talk.messages || []), { role: 'user', content: String(text) }];
  let reply = 'いいですね！もう少し話しましょう。';
  try { reply = await askClaude(TALK_SYSTEM(context), history.map((m: any) => ({ role: m.role, content: m.content })), 500); } catch {}

  const turns = (talk.turns || 0) + 1;
  const done = turns >= 3;
  await s.from('talks').update({ messages: [...history, { role: 'assistant', content: reply }], turns, done }).eq('id', talk.id);
  await markActivity(sess.id);
  return NextResponse.json({ ok: true, reply, reused, turns, done });
}
