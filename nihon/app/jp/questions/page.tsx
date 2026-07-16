'use client';
import { useEffect, useState } from 'react';

type Q = { id: string; question: string; answer: string; ask_teacher: boolean; created_at: string };

export default function Questions() {
  const [items, setItems] = useState<Q[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jp/questions/list')
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setLoading(false); });
  }, []);

  async function ask() {
    if (!q.trim() || busy) return;
    setBusy(true);
    const res = await fetch('/api/jp/questions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });
    const data = await res.json();
    if (res.ok) { setItems([data.item, ...items]); setQ(''); }
    setBusy(false);
  }

  async function toggle(item: Q) {
    const next = !item.ask_teacher;
    setItems(items.map((x) => (x.id === item.id ? { ...x, ask_teacher: next } : x)));
    fetch('/api/jp/questions', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: item.id, ask_teacher: next }),
    });
  }

  return (
    <>
      <header className="topbar"><div className="gem" /> <b>JP HUB</b></header>
      <div className="eyebrow">Question Box</div>
      <h1 className="big">궁금증은 <em>휙 저장</em>, 휘발 금지</h1>
      <div className="sub">AI가 즉답하고, 체크하면 수업 전날 &ldquo;선생님께 물어볼 것&rdquo;으로 함께 챙겨줍니다.</div>

      <div className="ask">
        <input
          placeholder="예: 〜んですけど 랑 〜ですが 차이?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
        />
        <button className="btn sm" onClick={ask} disabled={busy}>
          {busy ? <span className="spin" /> : '저장'}
        </button>
      </div>

      <div className="qa">
        {loading && <div className="empty">불러오는 중…</div>}
        {!loading && !items.length && <div className="empty">아직 질문이 없어요. 수업 중이든 길에서든, 궁금한 순간 바로 적어두세요.</div>}
        {items.map((item) => (
          <div key={item.id} className="item">
            <div className="q">{item.question}</div>
            {item.answer && <div className="a">{item.answer}</div>}
            <div className="meta">
              <button className={`chip ${item.ask_teacher ? '' : 'gray'}`} onClick={() => toggle(item)}>
                {item.ask_teacher ? '✓ 다음 수업 때 물어보기' : '다음 수업 때 물어보기'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
