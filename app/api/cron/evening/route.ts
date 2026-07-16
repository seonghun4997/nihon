import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { sendSMS } from '@/lib/solapi';
import { generateTopicsFor } from '@/lib/topics';
import { addDaysStr, todayStr, dayOfWeekKST, parseSlotsWeekdays } from '@/lib/cron-util';

export const maxDuration = 300;

// 매일 밤 (KST 21:00) — 내일 수업 있는 수강건: 주제 카드 생성 + 양측 리마인드
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const s = db();
  const tomorrowDay = (dayOfWeekKST() + 1) % 7;
  const forDate = addDaysStr(todayStr(), 1);
  const { data: enrs } = await s
    .from('enrollments')
    .select('id, slots, student:student_id(id, name, phone), teacher:teacher_id(id, name, phone)')
    .eq('status', 'active');

  let reminded = 0;
  for (const enr of (enrs || []) as any[]) {
    const slot = (parseSlotsWeekdays(enr.slots) as any[]).find((x) => x.weekday === tomorrowDay);
    if (!slot) continue;
    await generateTopicsFor(enr.student.id, forDate).catch(() => null);
    const where = slot.mode === 'online' ? `비대면${slot.place ? ' · ' + slot.place : ''}` : `대면${slot.place ? ' · ' + slot.place : ''}`;
    const app = process.env.APP_URL || '';
    const r1 = await sendSMS(enr.student.phone, `[nihon] 내일 ${slot.time} 수업 (${where})\n주제 카드가 도착했어요 → ${app}/s`);
    const r2 = await sendSMS(enr.teacher.phone, `[nihon] 내일 ${slot.time} ${enr.student.name} 학생 수업 (${where})\n브리핑 → ${app}/t`);
    if (r1.sent || r2.sent) reminded++;
  }
  return NextResponse.json({ ok: true, reminded });
}
