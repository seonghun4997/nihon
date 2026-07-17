'use client';
import { useState } from 'react';
import Link from 'next/link';

type Topic = { jp: string; ko: string; expressions: { jp: string; reading: string; ko: string; gram?: string }[]; reuse: string[] };

export default function TopicPicker({ forDate }: { forDate: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  async function load(reroll = false) {
    setState('loading');
    setSelected(null); setNoteId(null);
    const res = await fetch(`/api/s/topics?for=${forDate}${reroll ? '&reroll=1' : ''}`);
    const data = await res.json();
    if (data.empty) { setState('empty'); setMsg(data.reason); return; }
    if (!res.ok) { setState('error'); setMsg(data.error || '실패'); return; }
    setTopics(data.topics || []);
    setSelected(data.selected ?? null);
    setState('ready');
  }

  async function pick(i: number) {
    if (picking) return;
    setPicking(true);
    setSelected(i);
    const res = await fetch('/api/s/topics', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ for_date: forDate, selected: i }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.note_id) setNoteId(d.note_id);
    setPicking(false);
  }

  async function share() {
    if (selected === null) return;
    const t = topics[selected];
    const text = `[수업 주제]\n주제: ${t.jp}\n방향: ${t.ko}\n연습 표현:\n${t.expressions.map((e) => `- ${e.jp} (${e.ko})`).join('\n')}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  if (state === 'idle') return <div className="row"><button className="btn block" onClick={() => load()}>주제 3개 뽑기 →</button></div>;
  if (state === 'loading') return <div className="row"><button className="btn block" disabled><span className="spin" /> 주제를 뽑는 중…</button></div>;
  if (state === 'empty' || state === 'error') return <><div className="empty">{msg}</div><div className="row"><button className="btn ghost sm" onClick={() => load(true)}>다시 시도 →</button></div></>;

  const t = selected !== null ? topics[selected] : null;

  return (
    <>
      <div className="topics">
        {topics.map((tp, i) => (
          <button key={i} className={`topic ${selected === i ? 'sel' : ''}`} onClick={() => pick(i)}>
            <span className="jp">{tp.jp}</span>
            <span className="ko">{tp.ko}</span>
            <span className="pick">{selected === i ? '✓ 이 주제로' : '이걸로 →'}</span>
          </button>
        ))}
      </div>

      {t && (
        <div className="card" style={{ marginTop: 12, borderColor: 'rgba(62,221,140,.35)' }}>
          <div className="card-tag" style={{ color: 'var(--green)' }}>
            {picking ? '준비하는 중…' : `✓ 준비 완료 — 예습 노트 생성 · 표현 ${t.expressions.length}개 말하기 큐 적립`}
          </div>
          <div className="expr" style={{ marginTop: 10 }}>
            {t.expressions.map((e, i) => (
              <div key={i} className="li">
                <span className="jp">{e.jp}</span><span className="rd">{e.reading}</span><span className="ko">{e.ko}</span>
                {e.gram && <span className="gram">📐 {e.gram}</span>}
              </div>
            ))}
          </div>
          <p className="desc" style={{ marginTop: 10 }}>지금 이 표현들로 대화해 보세요. 하나씩 소리 내어 읽는 것부터 —</p>
          <div className="row">
            <Link href="/s/cards" className="btn sm">🎤 지금 입으로 연습 →</Link>
            {noteId && <Link href={`/s/notes/${noteId}`} className="btn ghost sm">예습 노트 보기</Link>}
          </div>
        </div>
      )}

      <div className="row">
        <button className="btn ghost sm" onClick={() => load(true)}>🎲 다시 뽑기</button>
        {t && <button className="btn ghost sm" onClick={share}>{copied ? '복사됐어요 ✓' : '카톡으로 공유'}</button>}
      </div>
    </>
  );
}
