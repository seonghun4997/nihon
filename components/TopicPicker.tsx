'use client';
import { useState } from 'react';

type Topic = { jp: string; ko: string; expressions: { jp: string; reading: string; ko: string }[]; reuse: string[] };

export default function TopicPicker({ forDate }: { forDate: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  async function load() {
    setState('loading');
    const res = await fetch(`/api/s/topics?for=${forDate}`);
    const data = await res.json();
    if (data.empty) { setState('empty'); setMsg(data.reason); return; }
    if (!res.ok) { setState('error'); setMsg(data.error || '실패'); return; }
    setTopics(data.topics || []);
    setSelected(data.selected ?? null);
    setState('ready');
  }

  async function pick(i: number) {
    setSelected(i);
    await fetch('/api/s/topics', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ for_date: forDate, selected: i }),
    });
  }

  async function share() {
    if (selected === null) return;
    const t = topics[selected];
    const text = `[내일 수업 주제]\n주제: ${t.jp}\n방향: ${t.ko}\n연습하고 싶은 표현:\n${t.expressions.map((e) => `- ${e.jp} (${e.ko})`).join('\n')}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  if (state === 'idle') return <div className="row"><button className="btn block" onClick={load}>내일 주제 카드 3개 받기 →</button></div>;
  if (state === 'loading') return <div className="row"><button className="btn block" disabled><span className="spin" /> 최근 수업에서 주제를 뽑는 중…</button></div>;
  if (state === 'empty' || state === 'error') return <div className="empty">{msg}</div>;

  return (
    <>
      <div className="topics">
        {topics.map((t, i) => (
          <button key={i} className={`topic ${selected === i ? 'sel' : ''}`} onClick={() => pick(i)}>
            <span className="jp">{t.jp}</span>
            <span className="ko">{t.ko}</span>
            {selected === i && <span className="ko" style={{ marginTop: 4 }}>예습: {t.expressions.slice(0, 3).map((e) => e.jp).join(' · ')} …</span>}
            <span className="pick">{selected === i ? '✓ 이 주제로' : '이걸로 →'}</span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="row">
          <button className="btn ghost sm" onClick={share}>{copied ? '복사됐어요 ✓' : '선생님께 공유 (카톡 복사)'}</button>
          <span className="hintline">선생님 브리핑에도 자동으로 들어가요</span>
        </div>
      )}
    </>
  );
}
