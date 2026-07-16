'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true); setErr('');
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: pw }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || '로그인 실패'); setBusy(false); return; }
    location.href = data.role === 'teacher' ? '/t' : data.role === 'owner' ? '/a' : '/s';
  }

  return (
    <div className="login">
      <div className="topbar" style={{ padding: 0 }}><div className="gem" /> <b>NIHON</b></div>
      <h1>다시 만나요 <em>👋</em></h1>
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      <input type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={submit} disabled={busy}>{busy ? <span className="spin" /> : '로그인 →'}</button>
      <p style={{ fontSize: 12.5, color: 'var(--dim)' }}>선생님이신가요? <Link href="/signup" style={{ color: 'var(--green)' }}>가입하기</Link> · 학생은 선생님의 초대 링크로 가입해요</p>
    </div>
  );
}
