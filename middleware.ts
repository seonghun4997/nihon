import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/jp/cron') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/icon.svg'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('jp_auth')?.value;
  const ok = !!process.env.ACCESS_CODE && token === process.env.ACCESS_CODE;

  if (!ok) {
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
