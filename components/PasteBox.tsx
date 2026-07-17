'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasteBox() {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [fileName, setFileName] = useState('');
  const router = useRouter();

  // 파일 업로드 (.txt 등 텍스트 파일) → 내용을 그대로 읽어옴
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const r = new FileReader();
    r.onload = () => { setRaw(String(r.result || '')); setErr(''); };
    r.onerror = () => setErr('파일을 읽지 못했어요 — 텍스트(.txt) 파일인지 확인해 주세요.');
    r.readAsText(f);
    e.target.value = '';
  }

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
        <div className="row" style={{ marginTop: 8 }}>
        <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
          📎 파일로 업로드 (.txt)
          <input type="file" accept=".txt,.text,.md,.srt,text/plain" onChange={onFile} style={{ display: 'none' }} />
        </label>
        {fileName && <span className="hintline">{fileName} 불러옴 ✓</span>}
      </div>
      <button className="btn block" onClick={submit} disabled={busy}>
          {busy ? <><span className="spin" /> AI가 수업을 분해하는 중… (30초쯤)</> : '수업 노트 만들기 →'}
        </button>
      </div>
    </>
  );
}
