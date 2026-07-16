'use client';
import { useState } from 'react';

export default function JoinForm({ code }: { code: string }) {
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    if (busy) return;
    setBusy(true); setErr('');
    const res = await fetch('/api/auth/join', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, code, consent }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || '가입 실패'); setBusy(false); return; }
    location.href = '/s';
  }

  return (
    <>
      <input placeholder="이름" value={form.name} onChange={set('name')} autoFocus />
      <input inputMode="numeric" placeholder="휴대폰 번호 (로그인 아이디 · 알림 수신)" value={form.phone} onChange={set('phone')} />
      <input type="password" placeholder="비밀번호 (6자 이상)" value={form.password} onChange={set('password')} />
      <label className="checkline" style={{ maxWidth: 320 }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>수업 녹음의 <b>텍스트</b>를 학습 노트 생성에 활용하는 것에 동의합니다. (음성 파일은 저장하지 않아요)</span>
      </label>
      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={submit} disabled={busy || !consent}>{busy ? <span className="spin" /> : '시작하기 →'}</button>
    </>
  );
}
