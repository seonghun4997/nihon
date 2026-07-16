'use client';
import { useEffect, useMemo, useState } from 'react';

type Word = { id: string; word: string; reading: string; meaning: string; stage: number };
type Confusion = { id: string; text: string; count: number };
type KanaRow = { key: string; label: string; chars: [string, string][]; accuracy: number | null };

const STAGE_LABEL = ['D1', 'D3', 'D7', 'D21'];

export default function Cards() {
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<Word[]>([]);
  const [confusions, setConfusions] = useState<Confusion[]>([]);
  const [kana, setKana] = useState<KanaRow[]>([]);

  const [wi, setWi] = useState(0);       // 단어 인덱스
  const [flip, setFlip] = useState(false);
  const [ci, setCi] = useState(0);       // 헷갈림 인덱스
  const [phase, setPhase] = useState<'words' | 'conf' | 'kana' | 'done'>('words');

  // 가나 드릴 상태
  const [ki, setKi] = useState(0);       // 행 인덱스
  const [kq, setKq] = useState(0);       // 문자 인덱스
  const [kShow, setKShow] = useState(false);
  const [kScore, setKScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    fetch('/api/jp/review')
      .then((r) => r.json())
      .then((d) => {
        setWords(d.words || []);
        setConfusions(d.confusions || []);
        setKana(d.kana || []);
        if (!(d.words || []).length) {
          if ((d.confusions || []).length) setPhase('conf');
          else if ((d.kana || []).length) setPhase('kana');
          else setPhase('done');
        }
        setLoading(false);
      });
  }, []);

  const total = words.length + confusions.length;
  const doneCount =
    phase === 'words' ? wi : phase === 'conf' ? words.length + ci : total;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 100;

  async function gradeWord(correct: boolean) {
    const w = words[wi];
    fetch('/api/jp/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'word', id: w.id, correct }),
    });
    setFlip(false);
    if (wi + 1 < words.length) setWi(wi + 1);
    else setPhase(confusions.length ? 'conf' : kana.length ? 'kana' : 'done');
  }

  async function gradeConf(correct: boolean) {
    const c = confusions[ci];
    fetch('/api/jp/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'confusion', id: c.id, correct }),
    });
    if (ci + 1 < confusions.length) setCi(ci + 1);
    else setPhase(kana.length ? 'kana' : 'done');
  }

  function gradeKana(correct: boolean) {
    setKScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setKShow(false);
    const row = kana[ki];
    if (kq + 1 < row.chars.length) { setKq(kq + 1); return; }
    // 행 완료 → 서버 반영
    fetch('/api/jp/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'kana', key: row.key, correct: kScore.correct + (correct ? 1 : 0), total: kScore.total + 1 }),
    });
    setKScore({ correct: 0, total: 0 });
    setKq(0);
    if (ki + 1 < kana.length) setKi(ki + 1);
    else setPhase('done');
  }

  if (loading) return <Shell><div className="empty">큐를 불러오는 중…</div></Shell>;

  return (
    <Shell>
      {total > 0 && phase !== 'done' && (
        <div className="turns" style={{ marginTop: 16 }}>
          <span>{Math.min(doneCount + 1, total)} / {total}</span>
          <div className="progressbar"><i style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      {phase === 'words' && words[wi] && (
        <>
          <button className="flash" onClick={() => setFlip(!flip)} aria-label="카드 뒤집기">
            <span className="due">{STAGE_LABEL[words[wi].stage] || 'D?'} 복습</span>
            <div className="word">{words[wi].word}</div>
            {flip ? (
              <div className="meaning">{words[wi].reading} — {words[wi].meaning}</div>
            ) : (
              <div className="hint">탭해서 뜻 확인</div>
            )}
          </button>
          <div className="grade">
            <button className="btn ghost" onClick={() => gradeWord(false)}>헷갈렸어요</button>
            <button className="btn" onClick={() => gradeWord(true)} disabled={!flip}>기억나요 ✓</button>
          </div>
        </>
      )}

      {phase === 'conf' && confusions[ci] && (
        <>
          <div className="flash">
            <span className="due">⭐ 헷갈림 재출제 · {confusions[ci].count}회째</span>
            <div className="word" style={{ fontSize: 20, lineHeight: 1.5 }}>{confusions[ci].text}</div>
            <div className="hint">이제 설명할 수 있나요? 소리 내어 한 번 말해보세요.</div>
          </div>
          <div className="grade">
            <button className="btn ghost" onClick={() => gradeConf(false)}>아직 헷갈려요</button>
            <button className="btn" onClick={() => gradeConf(true)}>이제 알아요 ✓ (해결)</button>
          </div>
        </>
      )}

      {phase === 'kana' && kana[ki] && (
        <>
          <button className="flash" onClick={() => setKShow(!kShow)} aria-label="읽기 확인">
            <span className="due">{kana[ki].label} · {kq + 1}/{kana[ki].chars.length}</span>
            <div className="word" style={{ fontSize: 52 }}>{kana[ki].chars[kq][0]}</div>
            {kShow ? (
              <div className="meaning">{kana[ki].chars[kq][1]}</div>
            ) : (
              <div className="hint">읽어보고 탭해서 확인</div>
            )}
          </button>
          <div className="grade">
            <button className="btn ghost" onClick={() => gradeKana(false)}>틀렸어요</button>
            <button className="btn" onClick={() => gradeKana(true)} disabled={!kShow}>맞았어요 ✓</button>
          </div>
          <div className="notice">
            <b>자동 은퇴제</b> — 이 행의 정답률이 95%를 넘기면 큐에서 조용히 빠집니다. 아는 걸 또 시키지 않아요.
          </div>
        </>
      )}

      {phase === 'done' && (
        <div className="card hero" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: 34 }}>✓</div>
          <h2 style={{ marginTop: 8 }}>오늘 몫 끝!</h2>
          <p className="desc">단어는 다음 만기일에 다시 만나요. 이제 앱을 닫아도 됩니다.</p>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar"><div className="gem" /> <b>JP HUB</b></header>
      <div className="eyebrow">Words &amp; Kana · 간격 반복 D1 · 3 · 7 · 21</div>
      <h1 className="big">오늘 몫만, <em>딱 10분</em></h1>
      <div className="sub">수업에서 자동으로 적립된 것만 나옵니다. 내가 등록할 건 없어요.</div>
      {children}
    </>
  );
}
