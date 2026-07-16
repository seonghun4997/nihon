import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { lang } = await req.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true });
  res.cookies.set('lang', lang === 'en' ? 'en' : 'jp', { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}
