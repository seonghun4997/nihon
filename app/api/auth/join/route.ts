import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { hashPassword, signSession, SESSION_COOKIE } from '@/lib/session';

// 학생 가입 — 초대 코드 필수 (선생님과 즉시 연결) + 녹음 동의 내장
export async function POST(req: NextRequest) {
  const { code, email, password, name, phone, consent } = await req.json().catch(() => ({}));
  if (!consent) return NextResponse.json({ error: '수업 녹음 활용 동의가 필요해요.' }, { status: 400 });
  const s = db();
  const { data: invite } = await s.from('invites').select('*').eq('code', String(code || '')).maybeSingle();
  if (!invite || invite.used_by) return NextResponse.json({ error: '유효하지 않은 초대 링크예요. 선생님께 다시 요청해 주세요.' }, { status: 400 });

  const e = String(email || '').toLowerCase().trim();
  if (!e.includes('@') || String(password || '').length < 6 || !String(name || '').trim()) {
    return NextResponse.json({ error: '이메일 · 이름 · 비밀번호(6자 이상)를 확인해 주세요.' }, { status: 400 });
  }
  const { data: user, error } = await s
    .from('users')
    .insert({
      email: e,
      name: String(name).trim(),
      phone: String(phone || '').trim() || null,
      password_hash: hashPassword(String(password)),
      role: 'student',
      approved: true,
    })
    .select()
    .single();
  if (error) {
    const msg = error.message.includes('duplicate') ? '이미 가입된 이메일이에요.' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  await s.from('invites').update({ used_by: user.id }).eq('code', invite.code);
  await s.from('enrollments').insert({ teacher_id: invite.teacher_id, student_id: user.id });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE.name, signSession({ id: user.id, role: 'student' }), SESSION_COOKIE.options);
  return res;
}
