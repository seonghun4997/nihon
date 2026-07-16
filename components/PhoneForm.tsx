'use client';
import { useState } from 'react';

export default function PhoneForm({ initial }: { initial: string }) {
  const [phone, setPhone] = useState(initial);
  const [saved, setSaved] = useState(false);
  async function save() {
    await fetch('/api/s/me', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="answer-box" style={{ marginTop: 8 }}>
      <input placeholder="휴대폰 번호 (복습·수업 리마인드 문자)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <button className="btn sm" onClick={save}>{saved ? '저장됨 ✓' : '저장'}</button>
    </div>
  );
}
