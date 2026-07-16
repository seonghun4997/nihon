export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { nextAfterCorrect, nextAfterWrong } from '@/lib/srs';
import { todayStr } from '@/lib/dates';
import { KANA_ROWS } from '@/lib/kana';

// GET: 오늘의 10분 큐 = 만기 단어(최대 7) + ⭐헷갈림 1~2 + 가나 드릴(은퇴 안 한 행)
export async function GET() {
  const s = db();
  const today = todayStr();

  const [{ data: words }, { data: confusions }, { data: kanaStats }] = await Promise.all([
    s.from('jp_words').select('*').eq('retired', false).lte('next_due', today).order('next_due').limit(7),
    s.from('jp_confusions').select('*').eq('resolved', false).gte('count', 2).order('count', { ascending: false }).limit(2),
    s.from('jp_kana').select('*'),
  ]);

  const statMap = new Map((kanaStats || []).map((k) => [k.key, k]));
  const activeRows = KANA_ROWS.filter((r) => !statMap.get(r.key)?.retired);
  // 하루엔 앞에서 두 행만 (10분 상한)
  const kana = activeRows.slice(0, 2).map((r) => ({
    key: r.key,
    label: r.label,
    chars: r.chars,
    accuracy: (() => {
      const st = statMap.get(r.key);
      return st && st.total > 0 ? Math.round((st.correct / st.total) * 100) : null;
    })(),
  }));

  return NextResponse.json({ words: words || [], confusions: confusions || [], kana });
}

// POST: 채점 { type: 'word'|'confusion'|'kana', id/key, correct, total? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const s = db();
  const today = todayStr();

  if (body.type === 'word') {
    const { data: w } = await s.from('jp_words').select('stage').eq('id', body.id).single();
    if (!w) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const next = body.correct ? nextAfterCorrect(w.stage) : nextAfterWrong();
    await s.from('jp_words').update({ stage: next.stage, next_due: next.nextDue, retired: next.retired }).eq('id', body.id);
  } else if (body.type === 'confusion') {
    if (body.correct) await s.from('jp_confusions').update({ resolved: true }).eq('id', body.id);
    else await s.from('jp_confusions').update({ last_seen: today }).eq('id', body.id);
  } else if (body.type === 'kana') {
    // 행 단위 누적: correct/total 델타 반영, 정답률 95% + 시도 40회 이상이면 자동 은퇴
    const { data: st } = await s.from('jp_kana').select('*').eq('key', body.key).single();
    const correct = (st?.correct || 0) + (body.correct || 0);
    const total = (st?.total || 0) + (body.total || 0);
    const retired = total >= 40 && correct / total >= 0.95;
    await s.from('jp_kana').upsert({ key: body.key, correct, total, retired });
  }

  await s.from('jp_activity').upsert({ day: today }, { onConflict: 'day', ignoreDuplicates: true });
  return NextResponse.json({ ok: true });
}
