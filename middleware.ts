import { NextRequest, NextResponse } from 'next/server';
import { authToken } from '@/lib/auth-token';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/jp/cron') || // CRON_SECRET로 자체 보호
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/icon.svg'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('jp_auth')?.value;
  if (!token || token !== (await authToken())) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
