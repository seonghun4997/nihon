import { NextRequest, NextResponse } from 'next/server';

async function authToken(): Promise<string> {
  const code = process.env.ACCESS_CODE || '';
  const data = new TextEncoder().encode('nihon-v1::' + code);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(req: NextRequest) {
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
