'use client';
import { useState } from 'react';

export default function InviteButton() {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function make() {
    setBusy(true);
    const res = await fetch('/api/t/invite', { method: 'POST' });
    const d = await res.json();
    if (res.ok) {
      const link = d.url || `${location.origin}/join/${d.code}`;
      setUrl(link);
      try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {}
    }
    setBusy(false);
  }

  return (
    <div style={{ width: '100%' }}>
      <button className="btn block" onClick={make} disabled={busy}>
        {busy ? <span className="spin" /> : copied ? '초대 링크 복사됨 ✓ — 카톡에 붙여넣으세요' : '+ 학생 초대 링크 만들기'}
      </button>
      {url && <p className="hintline" style={{ marginTop: 8, wordBreak: 'break-all' }}>{url} (1회용 — 학생마다 새로 만들어 주세요)</p>}
    </div>
  );
}
