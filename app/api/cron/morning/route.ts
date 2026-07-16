import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { sendSMS } from '@/lib/solapi';
import { todayStr } from '@/lib/dates';

export const maxDuration = 60;

// 매일 아침 (KST 07:00) — 복습 대기 있는 학생에게 문자 (전화번호 등록자만)
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const s = db();
  const today = todayStr();
  const { data: students } = await s.from('users').select('id, phone').eq('role', 'student').not('phone', 'is', null);
  let sent = 0;
  for (const u of students || []) {
    const { count } = await s.from('words').select('id', { count: 'exact', head: true })
      .eq('student_id', u.id).eq('retired', false).lte('next_due', today);
    if ((count || 0) > 0) {
      const r = await sendSMS(u.phone, `[nihon] 오늘의 복습 ${count}개 — 10분이면 끝\n${process.env.APP_URL || ''}/s/cards`);
      if (r.sent) sent++;
    }
  }
  return NextResponse.json({ ok: true, sent });
}
