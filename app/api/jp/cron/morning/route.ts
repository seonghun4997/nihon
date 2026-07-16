import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { sendSMS } from '@/lib/solapi';
import { todayStr } from '@/lib/dates';

export const maxDuration = 30;

// 매일 아침 (KST 07:00) — 오늘의 복습 문자. 앱 열 결심조차 대신한다.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const s = db();
  const today = todayStr();
  const [{ count: dueWords }, { count: starred }] = await Promise.all([
    s.from('jp_words').select('id', { count: 'exact', head: true }).eq('retired', false).lte('next_due', today),
    s.from('jp_confusions').select('id', { count: 'exact', head: true }).eq('resolved', false).gte('count', 2),
  ]);

  const n = (dueWords || 0) + Math.min(starred || 0, 2);
  if (n === 0) return NextResponse.json({ ok: true, skipped: '오늘 복습 없음' });

  const url = `${process.env.APP_URL || ''}/jp/cards`;
  const text = `[JP HUB] 오늘의 복습 ${n}개 — 10분이면 끝\n${url}`;
  const result = await sendSMS(text);
  return NextResponse.json({ ok: true, n, ...result });
}
