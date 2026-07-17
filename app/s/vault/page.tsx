import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { getLang, langName } from '@/lib/lang';
import { formatKo } from '@/lib/dates';
import Topbar from '@/components/Topbar';

export const dynamic = 'force-dynamic';

// 📦 저장 — 역대 배운 것 총람 (문법 · 단어 · 헷갈림)
export default async function Vault({ searchParams }: { searchParams: { tab?: string; q?: string } }) {
  const sess = getSession()!;
  const s = db();
  const lang = getLang();
  const tab = ['words', 'confusions'].includes(searchParams?.tab || '') ? searchParams.tab : 'grammar';
  const q = (searchParams?.q || '').trim();

  const [{ data: lessons }, { data: words }, { data: confusions }] = await Promise.all([
    s.from('lessons').select('id, lesson_date, title, note').eq('student_id', sess.id).eq('lang', lang).order('lesson_date', { ascending: false }).limit(100),
    s.from('words').select('*').eq('student_id', sess.id).eq('lang', lang).order('created_at', { ascending: false }).limit(500),
    s.from('confusions').select('*').eq('student_id', sess.id).eq('lang', lang).order('count', { ascending: false }).limit(200),
  ]);

  // 문법: 노트에서 누적 추출 (+검색)
  const grammar: { point: string; explain: string; examples: string[]; date: string; noteId: string; title: string }[] = [];
  for (const l of lessons || []) {
    for (const g of (l.note?.grammar || [])) {
      grammar.push({ point: g.point || '', explain: g.explain || '', examples: g.examples || [], date: String(l.lesson_date), noteId: l.id, title: l.title });
    }
  }
  const filt = (t: string) => !q || t.toLowerCase().includes(q.toLowerCase());
  const G = grammar.filter((g) => filt(g.point + g.explain));
  const W = (words || []).filter((w) => filt(w.word + w.reading + w.meaning));
  const C = (confusions || []).filter((c) => filt(c.text));

  const TabLink = ({ k, label, n }: { k: string; label: string; n: number }) => (
    <Link href={`/s/vault?tab=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={`vtab ${tab === k ? 'on' : ''}`}>{label} <b>{n}</b></Link>
  );

  return (
    <>
      <Topbar lang={lang} />
      <div className="eyebrow">Vault · {langName(lang)}</div>
      <h1 className="big">배운 건 전부 <em>여기 있다</em></h1>
      <div className="sub">수업·예습·미디어에서 쌓인 자산의 총람 — 시험 전날의 나에게 주는 선물.</div>

      <form action="/s/vault" method="get" className="answer-box" style={{ marginTop: 14 }}>
        <input type="hidden" name="tab" value={tab} />
        <input name="q" placeholder="문법·단어·헷갈림 검색" defaultValue={q} />
        <button className="btn sm" type="submit">검색</button>
      </form>

      <div className="vtabs">
        <TabLink k="grammar" label="📐 문법" n={G.length} />
        <TabLink k="words" label="🃏 단어" n={W.length} />
        <TabLink k="confusions" label="⭐ 헷갈림" n={C.length} />
      </div>

      {tab === 'grammar' && (
        G.length === 0 ? <div className="empty">아직 문법 포인트가 없어요 — 수업 노트를 만들면 자동으로 쌓입니다.</div> :
        G.map((g, i) => (
          <div className="card" key={i}>
            <div className="card-head">
              <h2 style={{ fontSize: 15.5 }}>{g.point}</h2>
              <Link href={`/s/notes/${g.noteId}`} className="chip gray">{formatKo(g.date)} →</Link>
            </div>
            <p className="desc" style={{ color: 'var(--text)' }}>{g.explain}</p>
            {g.examples.length > 0 && (
              <div className="expr" style={{ marginTop: 8 }}>
                {g.examples.map((ex, j) => <div key={j} className="li"><span className="ko">{ex}</span></div>)}
              </div>
            )}
          </div>
        ))
      )}

      {tab === 'words' && (
        W.length === 0 ? <div className="empty">단어가 아직 없어요.</div> :
        <div className="card">
          {W.map((w) => (
            <div key={w.id} className="vword">
              <span className="jp">{w.word}</span>
              <span className="rd">{w.reading}</span>
              <span className="ko">{w.meaning}</span>
              <span className={`chip ${w.retired ? '' : 'gray'}`}>{w.retired ? '졸업 🎓' : `D${[1, 3, 7, 21][w.stage] || 1}`}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'confusions' && (
        C.length === 0 ? <div className="empty">헷갈림 기록이 없어요 — 좋은 신호일 수도!</div> :
        <div className="card">
          {C.map((c) => (
            <div key={c.id} className="vword">
              <span className="jp" style={{ fontSize: 14 }}>{c.count >= 2 ? '⭐ ' : ''}{c.text}</span>
              <span className="chip gray">{c.count}회{c.resolved ? ' · 해결 ✓' : c.win_streak === 1 ? ' · 연속 1/2' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
