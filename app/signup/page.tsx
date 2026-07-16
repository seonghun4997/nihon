'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', adminCode: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    if (busy) return;
    setBusy(true); setErr('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || '가입 실패'); setBusy(false); return; }
    location.href = data.role === 'owner' ? '/a' : '/t';
  }

  return (
    <div className="login">
      <div className="topbar" style={{ padding: 0 }}><div className="gem" /> <b>NIHON</b></div>
      <h1>선생님 <em>가입</em></h1>
      <input placeholder="이름 (학생에게 보여요)" value={form.name} onChange={set('name')} autoFocus />
      <input type="email" placeholder="이메일" value={form.email} onChange={set('email')} />
      <input type="password" placeholder="비밀번호 (6자 이상)" value={form.password} onChange={set('password')} />
      <input placeholder="휴대폰 (선택 — 수업 리마인드 수신)" value={form.phone} onChange={set('phone')} />
      <input placeholder="관리자 코드 (운영자만)" value={form.adminCode} onChange={set('adminCode')} />
      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={submit} disabled={busy}>{busy ? <span className="spin" /> : '가입하기 →'}</button>
      <p style={{ fontSize: 12.5, color: 'var(--dim)', textAlign: 'center', maxWidth: 320 }}>
        가입 후 운영자 승인이 완료되면 학생 초대가 열려요.<br />이미 계정이 있다면 <Link href="/login" style={{ color: 'var(--green)' }}>로그인</Link>
      </p>
    </div>
  );
}
