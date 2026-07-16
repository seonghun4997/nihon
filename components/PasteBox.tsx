'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasteBox() {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit() {
    if (busy) return;
    if (raw.trim().length < 50) { setErr('다글로에서 전체 텍스트를 복사해 붙여넣어 주세요.'); return; }
    setBusy(true); setErr('');
    const res = await fetch('/api/s/lessons', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ raw }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || '실패했어요.'); setBusy(false); return; }
    router.push(`/s/notes/${data.id}`);
  }

  return (
    <>
      <textarea className="paste" placeholder="다글로 텍스트를 여기에 붙여넣기 — 한 번이면 표현·단어·문법·헷갈림으로 자동 분해되고, 출석도 자동 기록돼요."
        value={raw} onChange={(e) => setRaw(e.target.value)} />
      {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
      <div className="row">
        <button className="btn block" onClick={submit} disabled={busy}>
          {busy ? <><span className="spin" /> AI가 수업을 분해하는 중… (30초쯤)</> : '수업 노트 만들기 →'}
        </button>
      </div>
    </>
  );
}
