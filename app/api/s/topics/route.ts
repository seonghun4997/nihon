import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { generateTopicsFor } from '@/lib/topics';
import { addDaysStr, todayStr } from '@/lib/dates';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const forDate = req.nextUrl.searchParams.get('for') || addDaysStr(todayStr(), 1);
  try {
    const row = await generateTopicsFor(sess.id, forDate, getLang());
    if (!row) return NextResponse.json({ empty: true, reason: '수업 노트가 아직 없어요. 첫 수업을 붙여넣으면 주제가 생성됩니다.' });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: '주제 생성 실패: ' + e.message }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { for_date, selected } = await req.json().catch(() => ({}));
  const { error } = await db().from('topics').update({ selected }).eq('student_id', sess.id).eq('lang', getLang()).eq('for_date', for_date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
