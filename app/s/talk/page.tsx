'use client';
import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string; reused?: string[] };

export default function Talk() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [turns, setTurns] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/s/talk')
      .then((r) => r.json())
      .then((d) => {
        if (d.empty) { setEmpty(d.reason); setLoading(false); return; }
        setMsgs(d.messages || []);
        setTurns(d.turns || 0);
        setDone(!!d.done);
        setLoading(false);
      });
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function send() {
    if (!text.trim() || busy) return;
    const mine = text;
    setText('');
    setBusy(true);
    setMsgs((m) => [...m, { role: 'user', content: mine }]);

    const res = await fetch('/api/s/talk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: mine }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { ...copy[copy.length - 1], reused: d.reused };
        return [...copy, { role: 'assistant', content: d.reply }];
      });
      setTurns(d.turns);
      setDone(d.done);
    }
    setBusy(false);
  }

  return (
    <>
      <header className="topbar"><div className="gem" /> <b>NIHON</b></header>
      <div className="eyebrow">Keep Talking · 수업 이어하기</div>
      <h1 className="big">그 대화, <em>여기서 이어가기</em></h1>
      <div className="sub">배운 표현을 쓰면 ✓ · 힌트는 답장에 붙어 와요 · 3턴이면 오늘 완료.</div>

      {loading && <div className="empty">대화를 준비하는 중…</div>}
      {empty && <div className="empty">{empty}</div>}

      {!loading && !empty && (
        <>
          <div className="chat">
            {msgs.map((m, i) => (
              <div key={i} className={`bub ${m.role === 'user' ? 'me' : 'ai'}`}>
                {m.content}
                {m.reused && m.reused.length > 0 && (
                  <span className="use">✓ 배운 표현 재사용! ({m.reused.length})</span>
                )}
              </div>
            ))}
            {busy && <div className="bub ai" style={{ color: 'var(--dim)' }}>…</div>}
            <div ref={endRef} />
          </div>

          <div className="turns">
            <span>{Math.min(turns, 3)} / 3턴</span>
            <div className="progressbar"><i style={{ width: `${Math.min(turns / 3, 1) * 100}%` }} /></div>
            <span>{done ? '오늘 완료 ✓ (더 해도 좋아요)' : '3턴이면 오늘 완료'}</span>
          </div>

          <div className="composer">
            <input
              placeholder="🎤 키보드 마이크로 말해서 답해도 좋아요 (한국어 섞여도 OK)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn sm" onClick={send} disabled={busy}>보내기</button>
          </div>
        </>
      )}
    </>
  );
}
