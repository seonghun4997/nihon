import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { formatKo } from '@/lib/dates';
import Topbar from '@/components/Topbar';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function Notes({ searchParams }: { searchParams: { q?: string } }) {
  const sess = getSession()!;
  const q = searchParams?.q?.trim() || '';
  const lang = getLang();
  let query = db().from('lessons').select('id, lesson_date, title, note').eq('student_id', sess.id).eq('lang', lang).order('lesson_date', { ascending: false }).limit(50);
  if (q) query = query.or(`title.ilike.%${q}%,raw_text.ilike.%${q}%`);
  const { data: lessons } = await query;

  return (
    <>
      <Topbar lang={lang} />
      <div className="eyebrow">Lesson Notes</div>
      <h1 className="big">내 수업이 <em>교재</em>다</h1>
      <form className="ask" action="/s/notes" method="get">
        <input name="q" placeholder="표현·단어로 검색" defaultValue={q} />
        <button className="btn sm" type="submit">검색</button>
      </form>
      <div className="note-list">
        {(lessons || []).map((l) => (
          <Link key={l.id} href={`/s/notes/${l.id}`} className="note-item">
            <div className="t"><b>{formatKo(String(l.lesson_date))} · {l.title}</b>
              <div>표현 {(l.note?.expressions || []).length} · 문법 {(l.note?.grammar || []).length}</div></div>
            <span style={{ color: 'var(--dim)' }}>→</span>
          </Link>
        ))}
        {(!lessons || !lessons.length) && <div className="empty">{q ? '검색 결과가 없어요.' : '아직 노트가 없어요. 수업일에 홈에서 붙여넣으면 첫 노트가 생깁니다.'}</div>}
      </div>
    </>
  );
}
