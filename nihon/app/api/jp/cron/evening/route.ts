import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/solapi';
import { generateTopicsFor } from '@/lib/topics';
import { addDaysStr, todayStr, isDayBeforeLesson } from '@/lib/dates';

export const maxDuration = 60;

// 매일 밤 (KST 21:00) — 내일이 수업일이면 주제 카드 3개를 만들어 문자 발송
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!isDayBeforeLesson()) return NextResponse.json({ ok: true, skipped: '내일은 수업일 아님' });

  const forDate = addDaysStr(todayStr(), 1);
  const row = await generateTopicsFor(forDate).catch(() => null);
  if (!row) return NextResponse.json({ ok: true, skipped: '수업 노트 없음 — 주제 생성 불가' });

  const titles = (row.topics || []).map((t: any, i: number) => `${i + 1}. ${t.jp}`).join('\n');
  const url = `${process.env.APP_URL || ''}/jp`;
  const text = `[JP HUB] 내일 수업 주제 카드가 도착했어요\n${titles}\n고르러 가기: ${url}`;
  const result = await sendSMS(text);
  return NextResponse.json({ ok: true, ...result });
}
