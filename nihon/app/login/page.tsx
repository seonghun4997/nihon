'use client';
import { useState } from 'react';

export default function Login() {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!code || busy) return;
    setBusy(true); setErr('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (res.ok) location.href = '/jp';
    else { setErr('접속 코드가 맞지 않아요.'); setBusy(false); }
  }

  return (
    <div className="login">
      <div className="topbar" style={{ padding: 0 }}>
        <div className="gem" /> <b>JP&nbsp;HUB</b>
      </div>
      <h1>내 수업이 <em>교재</em>다</h1>
      <input
        type="password"
        placeholder="접속 코드"
        value={code}
        autoFocus
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={submit} disabled={busy}>
        {busy ? <span className="spin" /> : '들어가기 →'}
      </button>
    </div>
  );
}
