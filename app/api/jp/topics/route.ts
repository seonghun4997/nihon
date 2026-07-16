import { isAuthed } from '@/lib/guard';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { generateTopicsFor } from '@/lib/topics';
import { addDaysStr, todayStr } from '@/lib/dates';

export const maxDuration = 60;

// GET ?for=YYYY-MM-DD : 주제 카드 조회(없으면 생성)
export async function GET(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const forDate = req.nextUrl.searchParams.get('for') || addDaysStr(todayStr(), 1);
  try {
    const row = await generateTopicsFor(forDate);
    if (!row) return NextResponse.json({ empty: true, reason: '수업 노트가 아직 없어요. 첫 수업을 붙여넣으면 주제가 생성됩니다.' });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: '주제 생성 실패: ' + e.message }, { status: 502 });
  }
}

// PATCH: 주제 선택 { for_date, selected }
export async function PATCH(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { for_date, selected } = await req.json().catch(() => ({}));
  const s = db();
  const { error } = await s.from('jp_topics').update({ selected }).eq('for_date', for_date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
