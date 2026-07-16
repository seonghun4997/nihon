import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { hashPassword, signSession, SESSION_COOKIE } from '@/lib/session';

// 선생님 가입 (운영자 승인 대기) / 관리자 코드 입력 시 owner
export async function POST(req: NextRequest) {
  const { email, password, name, phone, adminCode } = await req.json().catch(() => ({}));
  const e = String(email || '').toLowerCase().trim();
  if (!e.includes('@') || String(password || '').length < 6 || !String(name || '').trim()) {
    return NextResponse.json({ error: '이메일 · 이름 · 비밀번호(6자 이상)를 확인해 주세요.' }, { status: 400 });
  }
  const isOwner = !!process.env.ACCESS_CODE && adminCode === process.env.ACCESS_CODE;
  const { data: user, error } = await db()
    .from('users')
    .insert({
      email: e,
      name: String(name).trim(),
      phone: String(phone || '').trim() || null,
      password_hash: hashPassword(String(password)),
      role: isOwner ? 'owner' : 'teacher',
      approved: isOwner,
    })
    .select()
    .single();
  if (error) {
    const msg = error.message.includes('duplicate') ? '이미 가입된 이메일이에요.' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, role: user.role, approved: user.approved });
  res.cookies.set(SESSION_COOKIE.name, signSession({ id: user.id, role: user.role }), SESSION_COOKIE.options);
  return res;
}
