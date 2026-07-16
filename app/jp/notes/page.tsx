import Link from 'next/link';
import { db } from '@/lib/supabase';
import { formatKo } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export default async function Notes({ searchParams }: { searchParams: { q?: string } }) {
  const s = db();
  const q = searchParams?.q?.trim() || '';

  let query = s.from('jp_lessons').select('id, lesson_date, title, note').order('lesson_date', { ascending: false }).limit(50);
  if (q) query = query.or(`title.ilike.%${q}%,raw_text.ilike.%${q}%`);
  const { data: lessons } = await query;

  return (
    <>
      <header className="topbar"><div className="gem" /> <b>JP HUB</b></header>
      <div className="eyebrow">Lesson Notes</div>
      <h1 className="big">내 수업이 <em>교재</em>다</h1>
      <div className="sub">붙여넣은 수업이 노트로 쌓입니다. &ldquo;3주 전 그 표현&rdquo;도 검색 한 번.</div>

      <form className="ask" action="/jp/notes" method="get">
        <input name="q" placeholder="표현·단어로 검색 (예: 打ち合わせ)" defaultValue={q} />
        <button className="btn sm" type="submit">검색</button>
      </form>

      <div className="note-list">
        {(lessons || []).map((l) => {
          const n = l.note || {};
          return (
            <Link key={l.id} href={`/jp/notes/${l.id}`} className="note-item">
              <div className="t">
                <b>{formatKo(String(l.lesson_date))} · {l.title}</b>
                <div>표현 {(n.expressions || []).length} · 문법 {(n.grammar || []).length}</div>
              </div>
              <span style={{ color: 'var(--dim)' }}>→</span>
            </Link>
          );
        })}
        {(!lessons || !lessons.length) && (
          <div className="empty">
            {q ? '검색 결과가 없어요.' : '아직 노트가 없어요. 수업일에 홈에서 다글로 텍스트를 붙여넣으면 첫 노트가 생깁니다.'}
          </div>
        )}
      </div>
    </>
  );
}
