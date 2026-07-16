'use client';
import { useState } from 'react';

export default function BriefingButton({ enrollmentId }: { enrollmentId: string }) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    const res = await fetch('/api/t/briefing', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    });
    const d = await res.json();
    setContent(res.ok ? d.content : '브리핑 생성 실패 — 다시 시도해 주세요.');
    setBusy(false);
  }
  if (content) return <div className="brief">{content}</div>;
  return (
    <div className="row">
      <button className="btn block" onClick={load} disabled={busy}>
        {busy ? <><span className="spin" /> 지난 노트·질문·헷갈림을 모으는 중…</> : '오늘 수업 브리핑 열기 →'}
      </button>
    </div>
  );
}
