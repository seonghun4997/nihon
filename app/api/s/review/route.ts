import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { nextAfterCorrect, nextAfterWrong } from '@/lib/srs';
import { todayStr } from '@/lib/dates';
import { KANA_ROWS } from '@/lib/kana';
import { markActivity } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sess = getSession();
  if (!sess || sess.role !== 'student') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = db();
  const today = todayStr();
  const [{ data: words }, { data: confusions }, { data: kanaStats }] = await Promise.all([
    s.from('words').select('*').eq('student_id', sess.id).eq('retired', false).lte('next_due', today).order('next_due').limit(7),
    s.from('confusions').select('*').eq('student_id', sess.id).eq('resolved', false).gte('count', 2).order('count', { ascending: false }).limit(2),
    s.from('kana').select('*').eq('student_id', sess.id),
  ]);
  const statMap = new Map((kanaStats || []).map((k) => [k.key, k]));
  const kana = KANA_ROWS.filter((r) => !statMap.get(r.key)?.retired).slice(0, 2).map((r) => ({ key: r.key, label: r.label, chars: r.chars }));
  return NextResponse.json({ words: words || [], confusions: confusions || [], kana });
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
  } else if (body.type === 'confusion') {
    if (body.correct) await s.from('confusions').update({ resolved: true }).eq('id', body.id).eq('student_id', sess.id);
    else await s.from('confusions').update({ last_seen: today }).eq('id', body.id).eq('student_id', sess.id);
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
