import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { sendSMS } from '@/lib/solapi';
import { todayStr } from '@/lib/dates';
import { OWNER_ID } from '@/lib/session';

export const maxDuration = 60;

// 아침 07:00 KST — 언어별 복습 대기 합산 문자
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const s = db();
  const today = todayStr();
  const { data: me } = await s.from('users').select('phone').eq('id', OWNER_ID).maybeSingle();
  const counts: string[] = [];
  for (const lang of ['jp', 'en'] as const) {
    const { count } = await s.from('words').select('id', { count: 'exact', head: true })
      .eq('student_id', OWNER_ID).eq('lang', lang).eq('retired', false).lte('next_due', today);
    if ((count || 0) > 0) counts.push(`${lang === 'jp' ? '일본어' : '영어'} ${count}개`);
  }
  if (!counts.length) return NextResponse.json({ ok: true, sent: 0 });
  const r = await sendSMS(me?.phone && me.phone !== '00000000000' ? me.phone : null,
    `[nihon] 오늘의 복습 — ${counts.join(' · ')}\n${process.env.APP_URL || ''}/s/cards`);
  return NextResponse.json({ ok: true, sent: r.sent ? 1 : 0 });
}
