'use client';
import { useEffect, useState } from 'react';
import Reading from '@/components/Reading';

type Expr = { jp: string; reading: string; kana?: string; ko: string; gram?: string; note?: string };
type Rec = { id: string; title: string; kind: string; why: string; how: string; expressions: Expr[]; created_at: string };

export default function Media() {
  const [items, setItems] = useState<Rec[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState('');
  const [err, setErr] = useState('');

  const [catchText, setCatchText] = useState('');
  const [catchBusy, setCatchBusy] = useState(false);
  const [caught, setCaught] = useState<Expr[]>([]);
  const [caughtN, setCaughtN] = useState(0);

  useEffect(() => {
    fetch('/api/s/media').then((r) => r.json()).then((d) => setItems(d.items || []));
  }, []);

  async function recommend() {
    if (busy) return;
    setBusy(true); setErr('');
    const res = await fetch('/api/s/media', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'recommend' }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error || '실패'); setBusy(false); return; }
    setItems([d.item, ...items]);
    setBusy(false);
  }

  async function saveExprs(rec: Rec) {
    const res = await fetch('/api/s/media', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'save', expressions: rec.expressions }),
    });
    if (res.ok) { setSavedId(rec.id); setTimeout(() => setSavedId(''), 2500); }
  }

  async function doCatch() {
    if (catchBusy || catchText.trim().length < 2) return;
    setCatchBusy(true); setErr('');
    const res = await fetch('/api/s/media', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'catch', text: catchText }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error || '실패'); setCatchBusy(false); return; }
    setCaught(d.items || []); setCaughtN(d.saved || 0); setCatchText('');
    setCatchBusy(false);
  }

  const latest = items[0];
  const history = items.slice(1);

  return (
    <>
      <header className="topbar"><div className="gem" /> <b>NIHON</b></header>
      <div className="eyebrow">Media</div>
      <h1 className="big">보면서 <em>배우기</em></h1>
      <div className="sub">영화·드라마·예능이 교재가 됩니다. 건진 문장은 🎤 말하기 큐로 들어가요.</div>

      <div className="card hero" style={{ marginTop: 18 }}>
        <div className="card-head">
          <div><div className="card-tag">오늘 볼 것</div><h2>AI 작품 추천</h2></div>
        </div>
        {latest ? (
          <>
            <p className="desc" style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>
              {latest.title} <span className="chip gray" style={{ marginLeft: 6 }}>{latest.kind}</span>
            </p>
            <p className="desc">{latest.why}</p>
            <p className="desc" style={{ color: 'var(--dim)' }}>📺 {latest.how}</p>
            <div className="expr" style={{ marginTop: 10 }}>
              {(latest.expressions || []).map((e, i) => (
                <div key={i} className="li">
                  <span className="jp">{e.jp}</span><Reading ko={e.reading} kana={e.kana} /><span className="ko">{e.ko}</span>
                  {e.gram && <span className="gram">📐 {e.gram}</span>}
                </div>
              ))}
            </div>
            <div className="row">
              <a className="btn sm" target="_blank" rel="noreferrer"
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(latest.title)}`}>
                ▶️ 유튜브에서 보기
              </a>
              <button className="btn ghost sm" onClick={() => saveExprs(latest)}>
                {savedId === latest.id ? '말하기 큐에 담김 ✓' : '표현 5개 → 복습 큐에 담기'}
              </button>
              <button className="btn ghost sm" onClick={recommend} disabled={busy}>
                {busy ? '고르는 중…' : '다른 작품'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="desc">목표("여행 가서 막힘없이")와 레벨에 맞는 작품을 골라줘요. 추천 이력이 쌓여 중복 없이.</p>
            <div className="row">
              <button className="btn block" onClick={recommend} disabled={busy}>
                {busy ? <><span className="spin" /> 목표에 맞는 작품 고르는 중…</> : '오늘의 작품 추천받기 →'}
              </button>
            </div>
          </>
        )}
        {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
      </div>

      <div className="card">
        <div className="card-head">
          <div><div className="card-tag">보다가 들린 그 문장</div><h2>건지기</h2></div>
        </div>
        <p className="desc">자막에서 캡처했거나 귀에 남은 문장을 붙여넣으면 — 교정·발음·뜻으로 분해하고 🎤 말하기 큐에 자동 적립.</p>
        <textarea className="paste" style={{ minHeight: 90 }}
          placeholder={'예)\nCould you recommend something local?\n I\'ll have what she\'s having'}
          value={catchText} onChange={(e) => setCatchText(e.target.value)} />
        <div className="row">
          <button className="btn block" onClick={doCatch} disabled={catchBusy}>
            {catchBusy ? <><span className="spin" /> 분해하는 중…</> : '분해해서 복습 큐에 담기 →'}
          </button>
        </div>
        {caught.length > 0 && (
          <div className="expr" style={{ marginTop: 12 }}>
            <p className="hintline" style={{ marginBottom: 6 }}>✓ {caughtN}개가 말하기 큐에 들어갔어요 — 내일 아침부터 입으로 테스트</p>
            {caught.map((e, i) => (
              <div key={i} className="li">
                <span className="jp">{e.jp}</span><Reading ko={e.reading} kana={e.kana} />
                <span className="ko">{e.ko}{e.note ? ` · ${e.note}` : ''}</span>
                {e.gram && <span className="gram">📐 {e.gram}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card">
          <div className="card-tag">추천 이력</div>
          <div className="conf" style={{ marginTop: 8 }}>
            {history.map((r) => <span key={r.id}>{r.title}</span>)}
          </div>
        </div>
      )}
    </>
  );
}
