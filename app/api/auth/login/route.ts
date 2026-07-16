import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { verifyPassword, signSession, SESSION_COOKIE } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  const { data: user } = await db().from('users').select('*').eq('email', String(email || '').toLowerCase().trim()).maybeSingle();
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, role: user.role, approved: user.approved });
  res.cookies.set(SESSION_COOKIE.name, signSession({ id: user.id, role: user.role }), SESSION_COOKIE.options);
  return res;
}
