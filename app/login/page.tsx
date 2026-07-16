'use client';
import { useState } from 'react';

export default function Login() {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true); setErr('');
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || '로그인 실패'); setBusy(false); return; }
    location.href = '/s';
  }

  return (
    <div className="login">
      <div className="topbar" style={{ padding: 0 }}><div className="gem" /> <b>NIHON</b></div>
      <h1>어서 오세요 <em>👋</em></h1>
      <input type="password" placeholder="접속 코드" value={code} onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()} autoFocus />
      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={submit} disabled={busy}>{busy ? <span className="spin" /> : '들어가기 →'}</button>
    </div>
  );
}
