import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { getLang, langName } from '@/lib/lang';
import { prefOf } from '@/lib/prefs';
import { todayStr, formatKo } from '@/lib/dates';
import Topbar from '@/components/Topbar';
import TopicPicker from '@/components/TopicPicker';

export const dynamic = 'force-dynamic';

export default async function Prep() {
  const sess = getSession()!;
  const lang = getLang();
  const { goal } = await prefOf(lang);
  const { data: preps } = await db().from('lessons').select('id, lesson_date, title, note')
    .eq('student_id', sess.id).eq('lang', lang).ilike('title', '예습%')
    .order('lesson_date', { ascending: false }).limit(20);

  return (
    <>
      <Topbar lang={lang} />
      <div className="eyebrow">Prep</div>
      <h1 className="big">수업 전에 <em>반 발짝</em></h1>
      <div className="sub">이야깃거리를 뽑아 고르면 예습 노트가 생기고, 표현은 말하기 큐로 들어갑니다.</div>

      <div className="card hero" style={{ marginTop: 18 }}>
        <div className="card-head"><div><div className="card-tag">수업 중에도 · 언제든지</div><h2>이야깃거리 뽑기</h2></div></div>
        <p className="desc">목표("{goal}") 기반 {langName(lang)} 주제 3개 — 대화가 막히면 그 자리에서.</p>
        <TopicPicker forDate={todayStr()} />
      </div>

      <div className="card">
        <div className="card-tag">예습 노트</div>
        {(preps || []).length === 0 ? (
          <p className="desc">아직 없어요 — 위에서 주제를 하나 고르면 첫 예습 노트가 생깁니다.</p>
        ) : (
          (preps || []).map((p) => (
            <Link key={p.id} href={`/s/notes/${p.id}`} className="note-row">
              <span className="date">{formatKo(String(p.lesson_date))}</span>
              <span className="title">{p.title}</span>
              <span className="meta">표현 {(p.note?.expressions || []).length}개 →</span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
