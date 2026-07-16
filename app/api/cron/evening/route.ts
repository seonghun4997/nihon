import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { sendSMS } from '@/lib/solapi';
import { generateTopicsFor } from '@/lib/topics';
import { addDaysStr, todayStr, dayOfWeekKST } from '@/lib/dates';
import { OWNER_ID } from '@/lib/session';

export const maxDuration = 300;

// 밤 21:00 KST — 내일 수업 언어의 주제 카드 생성 + 문자
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const s = db();
  const tomorrow = (dayOfWeekKST() + 1) % 7;
  const forDate = addDaysStr(todayStr(), 1);
  const { data: prefs } = await s.from('jp_prefs').select('*');
  const { data: me } = await s.from('users').select('phone').eq('id', OWNER_ID).maybeSingle();
  const hits: string[] = [];
  for (const p of prefs || []) {
    const days: number[] = Array.isArray(p.weekdays) ? p.weekdays : [];
    if (!days.includes(tomorrow)) continue;
    await generateTopicsFor(OWNER_ID, forDate, p.lang).catch(() => null);
    hits.push(p.lang === 'jp' ? '일본어' : '영어');
  }
  if (!hits.length) return NextResponse.json({ ok: true, sent: 0 });
  const r = await sendSMS(me?.phone && me.phone !== '00000000000' ? me.phone : null,
    `[nihon] 내일 ${hits.join('·')} 수업 — 주제 카드 3개 도착\n${process.env.APP_URL || ''}/s`);
  return NextResponse.json({ ok: true, sent: r.sent ? 1 : 0 });
}
