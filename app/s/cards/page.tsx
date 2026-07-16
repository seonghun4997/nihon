'use client';
import { useEffect, useRef, useState } from 'react';
import AddWord from '@/components/AddWord';

type Speak = { id: string; text: string; reading: string; ko: string; stage: number };
type Word = { id: string; word: string; reading: string; meaning: string; stage: number; requeued?: boolean };
type Confusion = { id: string; text: string; count: number; win_streak: number };
type KanaRow = { key: string; label: string; chars: [string, string][] };

const STAGE_LABEL = ['D1', 'D3', 'D7', 'D21'];

// ── 발화 채점: 정규화 후 유사도 (en: 단어 겹침 / jp: 2글자 조각 겹침) ──
function normEn(t: string) { return t.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function normJa(t: string) { return t.replace(/[\s。、！？!?.,'"「」]/g, ''); }
function similarity(said: string, target: string, lang: string): number {
  if (lang === 'en') {
    const a = new Set(normEn(said).split(' ').filter(Boolean));
    const b = normEn(target).split(' ').filter(Boolean);
    if (!b.length) return 0;
    return b.filter((w) => a.has(w)).length / b.length;
  }
  const s = normJa(said), t = normJa(target);
  if (t.length < 2) return s.includes(t) ? 1 : 0;
  let hit = 0, total = 0;
  for (let i = 0; i + 2 <= t.length; i++) { total++; if (s.includes(t.slice(i, i + 2))) hit++; }
  return total ? hit / total : 0;
}

export default function Cards() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'jp' | 'en'>('jp');
  const [speaks, setSpeaks] = useState<Speak[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [confusions, setConfusions] = useState<Confusion[]>([]);
  const [kana, setKana] = useState<KanaRow[]>([]);
  const [phase, setPhase] = useState<'speak' | 'words' | 'conf' | 'kana' | 'done'>('speak');

  // 말하기 테스트 상태
  const [si, setSi] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [verdict, setVerdict] = useState<'pass' | 'fail' | null>(null);
  const [reveal, setReveal] = useState(false);
  const [micOK, setMicOK] = useState<boolean | null>(null);
  const [tries, setTries] = useState(0);
  const recRef = useRef<any>(null);

  const [wi, setWi] = useState(0);
  const [flip, setFlip] = useState(false);
  const [ci, setCi] = useState(0);
  const [ki, setKi] = useState(0);
  const [kq, setKq] = useState(0);
  const [kShow, setKShow] = useState(false);
  const [kScore, setKScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setMicOK(!!SR);
    fetch('/api/s/review')
      .then((r) => r.json())
      .then((d) => {
        setLang(d.lang === 'en' ? 'en' : 'jp');
        setSpeaks(d.speaks || []);
        setWords(d.words || []);
        setConfusions(d.confusions || []);
        setKana(d.kana || []);
        if (!(d.speaks || []).length) {
          if ((d.words || []).length) setPhase('words');
          else if ((d.confusions || []).length) setPhase('conf');
          else if ((d.kana || []).length) setPhase('kana');
          else setPhase('done');
        }
        setLoading(false);
      });
  }, []);

  function grade(type: string, id: string, correct: boolean) {
    fetch('/api/s/review', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, id, correct }),
    });
  }

  // ── 말하기 테스트 ──
  function startListen() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMicOK(false); return; }
    const rec = new SR();
    recRef.current = rec;
    rec.lang = lang === 'en' ? 'en-US' : 'ja-JP';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    setListening(true); setHeard(''); setVerdict(null);
    rec.onresult = (e: any) => {
      const alts: string[] = Array.from(e.results[0]).map((r: any) => r.transcript);
      const target = speaks[si].text;
      let best = ''; let bestScore = 0;
      for (const a of alts) { const sc = similarity(a, target, lang); if (sc >= bestScore) { bestScore = sc; best = a; } }
      setHeard(best);
      setListening(false);
      const pass = bestScore >= 0.6;
      setVerdict(pass ? 'pass' : 'fail');
      setReveal(true);
      setTries((t) => t + 1);
      if (pass) grade('speak', speaks[si].id, true);
    };
    rec.onerror = () => { setListening(false); setHeard(''); };
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { setListening(false); }
  }

  function nextSpeak(passed: boolean) {
    if (!passed) grade('speak', speaks[si].id, false); // 오답 → D1로 리셋 (내일 또 나옴)
    setHeard(''); setVerdict(null); setReveal(false); setTries(0);
    if (si + 1 < speaks.length) setSi(si + 1);
    else setPhase(words.length ? 'words' : confusions.length ? 'conf' : kana.length ? 'kana' : 'done');
  }

  // ── 단어: 집요 모드 (틀리면 오늘 큐 끝에 다시) ──
  function gradeWord(correct: boolean) {
    const w = words[wi];
    if (!w.requeued) grade('word', w.id, correct); // SRS 반영은 첫 판정만
    setFlip(false);
    let list = words;
    if (!correct) list = [...words, { ...w, requeued: true }]; // 즉시 재출제
    setWords(list);
    if (wi + 1 < list.length) setWi(wi + 1);
    else setPhase(confusions.length ? 'conf' : kana.length ? 'kana' : 'done');
  }

  function gradeConf(correct: boolean) {
    const c = confusions[ci];
    grade('confusion', c.id, correct);
    if (ci + 1 < confusions.length) setCi(ci + 1);
    else setPhase(kana.length ? 'kana' : 'done');
  }

  function gradeKana(correct: boolean) {
    setKScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setKShow(false);
    const row = kana[ki];
    if (kq + 1 < row.chars.length) { setKq(kq + 1); return; }
    fetch('/api/s/review', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'kana', key: row.key, correct: kScore.correct + (correct ? 1 : 0), total: kScore.total + 1 }),
    });
    setKScore({ correct: 0, total: 0 });
    setKq(0);
    if (ki + 1 < kana.length) setKi(ki + 1);
    else setPhase('done');
  }

  const total = speaks.length + words.length + confusions.length;
  const doneCount = phase === 'speak' ? si : phase === 'words' ? speaks.length + wi : phase === 'conf' ? speaks.length + words.length + ci : total;
  const pct = total > 0 ? Math.round((Math.min(doneCount, total) / total) * 100) : 100;

  if (loading) return <Shell><div className="empty">큐를 불러오는 중…</div></Shell>;

  return (
    <Shell>
      {total > 0 && phase !== 'done' && (
        <div className="turns" style={{ marginTop: 16 }}>
          <span>{Math.min(doneCount + 1, total)} / {total}</span>
          <div className="progressbar"><i style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      {phase === 'speak' && speaks[si] && (
        <>
          <div className="flash">
            <span className="due">🗣 말하기 테스트 · {STAGE_LABEL[speaks[si].stage] || 'D?'} — 이 뜻을 {lang === 'en' ? '영어' : '일본어'}로</span>
            <div className="word" style={{ fontSize: 21, lineHeight: 1.4 }}>{speaks[si].ko}</div>
            {reveal ? (
              <div className="meaning">{speaks[si].text}<br /><span style={{ color: 'var(--dim)', fontSize: 12 }}>{speaks[si].reading}</span></div>
            ) : (
              <div className="hint">{micOK ? '마이크에 대고 소리 내어 말하면 채점해요' : '소리 내어 말한 뒤, 아래에서 정답을 확인하세요'}</div>
            )}
            {heard && <div className="hint" style={{ marginTop: 8 }}>들린 말: "{heard}"</div>}
            {verdict === 'pass' && <div className="hint" style={{ color: 'var(--green)', fontWeight: 700 }}>통과! 막힘없이 나왔어요 ✓</div>}
            {verdict === 'fail' && <div className="hint" style={{ color: '#ff9d76' }}>조금 달랐어요 — 정답을 보고 다시 한 번</div>}
          </div>

          {micOK && verdict !== 'pass' && (
            <div className="row">
              <button className="btn block" onClick={startListen} disabled={listening}>
                {listening ? <><span className="spin" /> 듣는 중… 지금 말하세요</> : tries > 0 ? '🎤 다시 말하기' : '🎤 말하기 시작'}
              </button>
            </div>
          )}

          <div className="grade">
            {!micOK && !reveal && <button className="btn" onClick={() => setReveal(true)}>말해봤어요 → 정답 확인</button>}
            {(reveal || verdict) && (
              <>
                {verdict !== 'pass' && <button className="btn ghost" onClick={() => nextSpeak(false)}>막혔어요 (내일 또)</button>}
                <button className="btn" onClick={() => nextSpeak(true)}>{verdict === 'pass' ? '다음 →' : '입으로 됐어요 ✓'}</button>
              </>
            )}
          </div>
          <div className="notice"><b>집요 모드</b> — 통과 못 한 표현은 D1로 돌아가 내일 또 나옵니다. 막힘없이 나올 때까지.</div>
        </>
      )}

      {phase === 'words' && words[wi] && (
        <>
          <button className="flash" onClick={() => setFlip(!flip)} aria-label="카드 뒤집기">
            <span className="due">{words[wi].requeued ? '↻ 아까 틀린 것 — 한 번 더' : `${STAGE_LABEL[words[wi].stage] || 'D?'} 복습`}</span>
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
          {!words[wi].requeued && <div className="notice"><b>집요 모드</b> — 틀린 단어는 오늘 세션 끝에 즉시 다시 나옵니다.</div>}
        </>
      )}

      {phase === 'conf' && confusions[ci] && (
        <>
          <div className="flash">
            <span className="due">⭐ 헷갈림 재출제 · {confusions[ci].count}회째{confusions[ci].win_streak === 1 ? ' · 연속 1/2' : ''}</span>
            <div className="word" style={{ fontSize: 20, lineHeight: 1.5 }}>{confusions[ci].text}</div>
            <div className="hint">이제 설명할 수 있나요? 소리 내어 한 번 말해보세요.</div>
          </div>
          <div className="grade">
            <button className="btn ghost" onClick={() => gradeConf(false)}>아직 헷갈려요</button>
            <button className="btn" onClick={() => gradeConf(true)}>이제 알아요 ✓</button>
          </div>
          <div className="notice"><b>집요 모드</b> — 연속 2회 "알아요"여야 해결 처리. 한 번 맞고 잊는 걸 막습니다.</div>
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
          <div className="notice"><b>자동 은퇴제</b> — 이 행의 정답률이 95%를 넘기면 큐에서 조용히 빠집니다.</div>
        </>
      )}

      {phase === 'done' && (
        <div className="card hero" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: 34 }}>✓</div>
          <h2 style={{ marginTop: 8 }}>오늘 몫 끝!</h2>
          <p className="desc">막힌 표현은 입으로 나올 때까지 다시 옵니다. 이제 앱을 닫아도 돼요.</p>
        </div>
      )}
      <AddWord />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar"><div className="gem" /> <b>NIHON</b></header>
      <div className="eyebrow">Review · 간격 반복 D1 · 3 · 7 · 21</div>
      <h1 className="big">오늘 몫만, <em>딱 10분</em></h1>
      <div className="sub">수업에서 자동 적립된 것만 나옵니다. 막힌 표현은 🎤 입으로 통과해야 끝나요.</div>
      {children}
    </>
  );
}
