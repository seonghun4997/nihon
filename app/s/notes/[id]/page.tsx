import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { formatKo } from '@/lib/dates';
import Reading from '@/components/Reading';

export const dynamic = 'force-dynamic';

export default async function NoteDetail({ params }: { params: { id: string } }) {
  const sess = getSession()!;
  const s = db();
  const { data: l } = await s.from('lessons').select('*').eq('id', params.id).eq('student_id', sess.id).maybeSingle();
  if (!l) notFound();
  const { data: words } = await s.from('words').select('word, meaning').eq('lesson_id', l.id);
  const { data: confusions } = await s.from('confusions').select('text, count').eq('lesson_id', l.id);
  const exprs: any[] = l.note?.expressions || [];
  const grammar: any[] = l.note?.grammar || [];

  return (
    <>
      <header className="topbar"><Link href="/s/notes" style={{ color: 'var(--dim)', fontSize: 13 }}>← 수업 노트</Link></header>
      <div className="eyebrow">{formatKo(String(l.lesson_date))}</div>
      <h1 className="big">{l.title}</h1>
      <div className="sub">표현 {exprs.length} · 단어 {(words || []).length} · 헷갈림 {(confusions || []).length} — 단어는 복습 큐에 자동 적립됐어요.</div>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="block">
          <h4>오늘의 표현</h4>
          <div className="expr">
            {exprs.map((e, i) => (
              <div key={i} className={`li ${e.stuck ? 'stuck' : ''}`}>
                {e.stuck && <span className="badge">말하려다 막힌 것</span>}
                <span className="jp">{e.jp}</span><Reading ko={e.reading} kana={e.kana} /><span className="ko">{e.ko}</span>
                {e.gram && <span className="gram">📐 {e.gram}</span>}
              </div>
            ))}
          </div>
        </div>
        {grammar.length > 0 && (
          <div className="block"><h4>문법 포인트</h4>
            {grammar.map((g, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{g.point}</div>
                <p className="desc" style={{ marginTop: 3 }}>{g.explain}</p>
                {(g.examples || []).map((ex: string, j: number) => <p key={j} className="desc" style={{ marginTop: 3, color: 'var(--dim)' }}>· {ex}</p>)}
              </div>
            ))}
          </div>
        )}
        {(words || []).length > 0 && (
          <div className="block"><h4>새 단어 → 단어장 적립</h4>
            <div className="conf">{(words || []).map((w, i) => <span key={i}>{w.word} <em style={{ fontStyle: 'normal', color: 'var(--dim)' }}>{w.meaning}</em></span>)}</div>
          </div>
        )}
        {(confusions || []).length > 0 && (
          <div className="block"><h4>헷갈림 노트</h4>
            <div className="conf">{(confusions || []).map((c, i) => <span key={i} className={c.count >= 2 ? 'hot' : ''}>{c.count >= 2 ? '⭐ ' : ''}{c.text}{c.count >= 2 ? ` (${c.count}회째)` : ''}</span>)}</div>
          </div>
        )}
      </div>
    </>
  );
}
