import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// 언어별 수업 요일 설정
export async function PATCH(req: NextRequest) {
  const sess = getSession();
  if (!sess) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { lang, weekdays, goal } = await req.json().catch(() => ({}));
  if (!['jp', 'en'].includes(lang)) return NextResponse.json({ error: 'bad input' }, { status: 400 });
  const patch: any = { lang };
  if (Array.isArray(weekdays)) patch.weekdays = Array.from(new Set(weekdays.map(Number).filter((n: number) => n >= 0 && n <= 6)));
  if (typeof goal === 'string' && goal.trim()) patch.goal = goal.trim().slice(0, 120);
  const { error } = await db().from('jp_prefs').upsert(patch);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
