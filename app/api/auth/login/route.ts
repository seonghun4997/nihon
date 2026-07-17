import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';
import { ensureSeed } from '@/lib/seed';

// 오너 전용: 접속 코드 로그인
export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({}));
  if (!process.env.ACCESS_CODE) {
    return NextResponse.json({ error: '서비스 설정이 아직 안 됐어요.' }, { status: 503 });
  }
  if (code !== process.env.ACCESS_CODE) {
    return NextResponse.json({ error: '접속 코드가 맞지 않아요.' }, { status: 401 });
  }
  await ensureSeed();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE.name, String(code), SESSION_COOKIE.options);
  return res;
}
