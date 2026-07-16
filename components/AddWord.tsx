'use client';
import { useState } from 'react';

export default function AddWord() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ word: '', reading: '', meaning: '' });
  const [msg, setMsg] = useState('');
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  async function add() {
    if (!f.word.trim() || !f.meaning.trim()) { setMsg('단어와 뜻은 필수예요.'); return; }
    const res = await fetch('/api/s/words', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
    });
    if (res.ok) { setF({ word: '', reading: '', meaning: '' }); setMsg('내일 복습 큐에 들어갔어요 ✓'); setTimeout(() => setMsg(''), 2500); }
    else setMsg('저장 실패 — 다시 시도해 주세요.');
  }

  if (!open) return (
    <div className="row" style={{ marginTop: 20, justifyContent: 'center' }}>
      <button className="btn ghost sm" onClick={() => setOpen(true)}>+ 단어 직접 추가</button>
    </div>
  );

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-tag">단어 직접 추가 — 내일부터 복습 큐에</div>
      <div className="answer-box" style={{ marginTop: 10 }}><input placeholder="단어 (예: 手続き / boarding pass)" value={f.word} onChange={set('word')} /></div>
      <div className="answer-box"><input placeholder="발음 (선택 — てつづき / 보딩 패스)" value={f.reading} onChange={set('reading')} /></div>
      <div className="answer-box"><input placeholder="뜻 (예: 수속)" value={f.meaning} onChange={set('meaning')} /></div>
      <div className="row">
        <button className="btn sm" onClick={add}>추가</button>
        <button className="btn ghost sm" onClick={() => setOpen(false)}>닫기</button>
        {msg && <span className="hintline">{msg}</span>}
      </div>
    </div>
  );
}
