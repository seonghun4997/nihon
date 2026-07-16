import { NextRequest, NextResponse } from 'next/server';
import { authToken, AUTH_COOKIE } from '@/lib/auth-token';

export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({ code: '' }));
  if (!process.env.ACCESS_CODE || code !== process.env.ACCESS_CODE) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await authToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1년 — 오너 폰에서 다시 로그인할 일 없게
  });
  return res;
}
