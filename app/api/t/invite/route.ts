import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// 학생 초대 코드 발급 — 링크 1개가 온보딩의 전부
export async function POST() {
  const sess = getSession();
  if (!sess || sess.role !== 'teacher') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const code = randomBytes(4).toString('hex');
  const { error } = await db().from('invites').insert({ code, teacher_id: sess.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, code, url: `${process.env.APP_URL || ''}/join/${code}` });
}
