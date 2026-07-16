import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { getLang } from '@/lib/lang';
import { initialDue } from '@/lib/srs';
import { markActivity } from '@/lib/data';

// 단어 수동 추가 — 복습 큐 직행
export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { word, reading, meaning } = await req.json().catch(() => ({}));
  if (!String(word || '').trim() || !String(meaning || '').trim()) {
    return NextResponse.json({ error: '단어와 뜻을 입력해 주세요.' }, { status: 400 });
  }
  const { error } = await db().from('words').upsert({
    student_id: sess.id, lang: getLang(),
    word: String(word).trim().slice(0, 200),
    reading: String(reading || '').trim().slice(0, 200),
    meaning: String(meaning).trim().slice(0, 200),
    stage: 0, next_due: initialDue(),
  }, { onConflict: 'student_id,word,meaning', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await markActivity(sess.id);
  return NextResponse.json({ ok: true });
}
