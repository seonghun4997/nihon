import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { todayStr } from '@/lib/dates';
import { streakOf } from '@/lib/data';
import { OWNER_ID } from '@/lib/session';

export const dynamic = 'force-dynamic';

// 폰 위젯용 요약 JSON — Scriptable(iOS)/KWGT(안드로이드)가 읽어감
// GET /api/widget?key=ACCESS_CODE
export async function GET(req: NextRequest) {
  if (!process.env.ACCESS_CODE || req.nextUrl.searchParams.get('key') !== process.env.ACCESS_CODE) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const s = db();
    const today = todayStr();
    const out: any = { streak: await streakOf(OWNER_ID), langs: {} };
    for (const lang of ['jp', 'en'] as const) {
      const [{ count: w }, { count: sp }] = await Promise.all([
        s.from('words').select('id', { count: 'exact', head: true }).eq('student_id', OWNER_ID).eq('lang', lang).eq('retired', false).lte('next_due', today),
        s.from('speaks').select('id', { count: 'exact', head: true }).eq('student_id', OWNER_ID).eq('lang', lang).eq('retired', false).lte('next_due', today),
      ]);
      const [{ count: sp1 }, { count: wd }, { count: spd }] = await Promise.all([
        s.from('speaks').select('id', { count: 'exact', head: true }).eq('student_id', OWNER_ID).eq('lang', lang).gte('stage', 1),
        s.from('words').select('id', { count: 'exact', head: true }).eq('student_id', OWNER_ID).eq('lang', lang).eq('retired', true),
        s.from('speaks').select('id', { count: 'exact', head: true }).eq('student_id', OWNER_ID).eq('lang', lang).eq('retired', true),
      ]);
      out.langs[lang] = { words: w || 0, speaks: sp || 0, goalScore: (sp1 || 0) + (wd || 0) + (spd || 0) };
    }
    out.goalScore = out.langs.jp.goalScore + out.langs.en.goalScore;
    out.total = out.langs.jp.words + out.langs.jp.speaks + out.langs.en.words + out.langs.en.speaks;
    out.message = out.total > 0 ? `오늘 복습 ${out.total}개 대기` : '오늘 몫 없음 🎉';
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }
}
