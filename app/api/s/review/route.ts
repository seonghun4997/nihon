import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { nextAfterCorrect, nextAfterWrong } from '@/lib/srs';
import { todayStr } from '@/lib/dates';
import { KANA_ROWS } from '@/lib/kana';
import { markActivity } from '@/lib/data';
import { getLang } from '@/lib/lang';
import { forceKoreanReading } from '@/lib/kana2ko';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = db();
  const today = todayStr();
  const lang = getLang();
  const [{ data: speaks }, { data: words }, { data: confusions }, { data: kanaStats }] = await Promise.all([
    s.from('speaks').select('*').eq('student_id', sess.id).eq('lang', lang).eq('retired', false).lte('next_due', today).order('next_due').limit(3),
    s.from('words').select('*').eq('student_id', sess.id).eq('lang', lang).eq('retired', false).lte('next_due', today).order('next_due').limit(7),
    s.from('confusions').select('*').eq('student_id', sess.id).eq('lang', lang).eq('resolved', false).gte('count', 2).order('count', { ascending: false }).limit(2),
    s.from('kana').select('*').eq('student_id', sess.id),
  ]);
  const statMap = new Map((kanaStats || []).map((k) => [k.key, k]));
  const kana = lang !== 'jp' ? [] : KANA_ROWS.filter((r) => !statMap.get(r.key)?.retired).slice(0, 2).map((r) => ({ key: r.key, label: r.label, chars: r.chars }));
  return NextResponse.json({
    lang,
    speaks: (speaks || []).map((sp) => forceKoreanReading(sp, lang)),
    words: (words || []).map((w) => forceKoreanReading(w, lang)),
    confusions: confusions || [],
    kana,
  });
}

export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const s = db();
  const today = todayStr();

  if (body.type === 'word') {
    const { data: w } = await s.from('words').select('stage').eq('id', body.id).eq('student_id', sess.id).single();
    if (!w) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const next = body.correct ? nextAfterCorrect(w.stage) : nextAfterWrong();
    await s.from('words').update({ stage: next.stage, next_due: next.nextDue, retired: next.retired }).eq('id', body.id);
  } else if (body.type === 'speak') {
    const { data: sp } = await s.from('speaks').select('stage').eq('id', body.id).eq('student_id', sess.id).single();
    if (!sp) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const next = body.correct ? nextAfterCorrect(sp.stage) : nextAfterWrong();
    await s.from('speaks').update({ stage: next.stage, next_due: next.nextDue, retired: next.retired }).eq('id', body.id);
  } else if (body.type === 'confusion') {
    // 집요 모드: 연속 2회 정답이어야 해결
    const { data: c } = await s.from('confusions').select('win_streak').eq('id', body.id).eq('student_id', sess.id).single();
    if (!c) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (body.correct) {
      const streak = (c.win_streak || 0) + 1;
      await s.from('confusions').update({ win_streak: streak, resolved: streak >= 2, last_seen: today }).eq('id', body.id);
    } else {
      await s.from('confusions').update({ win_streak: 0, last_seen: today }).eq('id', body.id);
    }
  } else if (body.type === 'kana') {
    const { data: st } = await s.from('kana').select('*').eq('student_id', sess.id).eq('key', body.key).maybeSingle();
    const correct = (st?.correct || 0) + (body.correct || 0);
    const total = (st?.total || 0) + (body.total || 0);
    const retired = total >= 40 && correct / total >= 0.95;
    await s.from('kana').upsert({ student_id: sess.id, key: body.key, correct, total, retired });
  }
  await markActivity(sess.id);
  return NextResponse.json({ ok: true });
}
