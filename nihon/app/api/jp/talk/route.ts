export const dynamic = 'force-dynamic';
import { isAuthed } from '@/lib/guard';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { askClaude, TALK_SYSTEM } from '@/lib/claude';
import { todayStr } from '@/lib/dates';

export const maxDuration = 30;

async function lessonContext() {
  const s = db();
  const { data: lesson } = await s
    .from('jp_lessons')
    .select('id, title, note')
    .order('lesson_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lesson) return { lessonId: null, context: '', expressions: [] as string[] };
  const exprs: { jp: string; ko: string }[] = lesson.note?.expressions || [];
  const context =
    `주제: ${lesson.title}\n배운 표현:\n` + exprs.map((e) => `- ${e.jp} (${e.ko})`).join('\n');
  return { lessonId: lesson.id, context, expressions: exprs.map((e) => e.jp) };
}

// GET: 오늘의 대화 세션 (없으면 AI 첫 마디로 시작)
export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = db();
  const today = todayStr();
  const { data: existing } = await s.from('jp_talks').select('*').eq('talk_date', today).maybeSingle();
  if (existing) return NextResponse.json(existing);

  const { lessonId, context } = await lessonContext();
  if (!lessonId) return NextResponse.json({ empty: true, reason: '수업 노트가 아직 없어요. 첫 수업을 붙여넣으면 이어하기가 열립니다.' });

  let opener = 'こんにちは！最近どうですか？\n(힌트: 元気です / ちょっと忙しいです 로 답해보세요)';
  try {
    opener = await askClaude(TALK_SYSTEM(context), [{ role: 'user', content: '대화를 시작해 주세요. 수업 주제를 이어가는 가벼운 질문 하나로.' }], 400);
  } catch {}

  const messages = [{ role: 'assistant', content: opener }];
  const { data } = await s
    .from('jp_talks')
    .insert({ talk_date: today, lesson_id: lessonId, messages, turns: 0 })
    .select()
    .single();
  return NextResponse.json(data);
}

// POST: 내 답장 { text } → AI 응답 + 배운 표현 재사용 감지
export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { text } = await req.json().catch(() => ({}));
  if (!text || !String(text).trim()) return NextResponse.json({ error: '내용을 입력해 주세요.' }, { status: 400 });

  const s = db();
  const today = todayStr();
  const { data: talk } = await s.from('jp_talks').select('*').eq('talk_date', today).maybeSingle();
  if (!talk) return NextResponse.json({ error: '세션이 없어요. 새로고침해 주세요.' }, { status: 404 });

  const { context, expressions } = await lessonContext();

  // 배운 표현 재사용 감지 (핵심 4글자 이상 겹치면 인정 — 가볍게)
  const reused = expressions.filter((jp) => {
    const core = jp.replace(/[。、！？\s]/g, '');
    for (let i = 0; i + 4 <= core.length; i++) {
      if (String(text).includes(core.slice(i, i + 4))) return true;
    }
    return false;
  });

  const history = [...(talk.messages || []), { role: 'user', content: String(text) }];
  let reply = 'いいですね！もう少し話しましょう。';
  try {
    reply = await askClaude(
      TALK_SYSTEM(context),
      history.map((m: any) => ({ role: m.role, content: m.content })),
      500
    );
  } catch {}

  const messages = [...history, { role: 'assistant', content: reply }];
  const turns = (talk.turns || 0) + 1;
  const done = turns >= 3; // 3턴이면 완료 — 부담 0 설계

  await s.from('jp_talks').update({ messages, turns, done }).eq('id', talk.id);
  await s.from('jp_activity').upsert({ day: today }, { onConflict: 'day', ignoreDuplicates: true });

  return NextResponse.json({ ok: true, reply, reused, turns, done });
}
