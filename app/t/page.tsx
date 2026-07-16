import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { getUser, teacherEnrollments, reviewRate7d, parseSlots } from '@/lib/data';
import { dayOfWeekKST, DAY_KO, nowKST } from '@/lib/dates';
import Topbar from '@/components/Topbar';
import BriefingButton from '@/components/BriefingButton';

export const dynamic = 'force-dynamic';

export default async function TeacherToday() {
  const sess = getSession()!;
  const s = db();
  const me = await getUser(sess.id);
  const enrs = await teacherEnrollments(sess.id);
  const todayDay = dayOfWeekKST();

  const todaysLessons = enrs
    .map((e) => ({ e, slot: parseSlots(e.slots).find((x) => x.weekday === todayDay) }))
    .filter((x) => x.slot);

  // 미답변 질문 수 + 이탈 신호
  const enriched = await Promise.all(
    enrs.map(async (e) => {
      const [{ count: unanswered }, rate] = await Promise.all([
        s.from('questions').select('id', { count: 'exact', head: true }).eq('enrollment_id', e.id).eq('ask_teacher', true).is('answered_at', null),
        reviewRate7d(e.student.id),
      ]);
      return { ...e, unanswered: unanswered || 0, rate };
    })
  );
  const totalUnanswered = enriched.reduce((a, b) => a + b.unanswered, 0);
  const churnRisk = enriched.filter((e) => e.status === 'active' && e.rate === 0);
  const d = nowKST();

  return (
    <>
      <Topbar name={me?.name} badge="선생님" />
      <div className="eyebrow">Today · {d.getUTCMonth() + 1}월 {d.getUTCDate()}일 {DAY_KO[d.getUTCDay()]}요일</div>
      <h1 className="big">{todaysLessons.length > 0 ? <>오늘 수업 <em>{todaysLessons.length}건</em>.<br />준비는 브리핑이 합니다.</> : <>오늘 수업은 없어요.<br /><em>답변</em>만 가볍게 챙기면 끝.</>}</h1>

      {todaysLessons.map(({ e, slot }) => (
        <div key={e.id} className="card hero">
          <div className="card-head">
            <div><div className="card-tag">{slot!.time} · {slot!.mode === 'online' ? '비대면' : '대면'}{slot!.place ? ' · ' + slot!.place : ''}</div>
              <h2>{e.student.name} 학생</h2></div>
            <Link href={`/t/students/${e.id}`} className="chip gray">상세 →</Link>
          </div>
          <BriefingButton enrollmentId={e.id} />
        </div>
      ))}

      {totalUnanswered > 0 && (
        <div className="card">
          <div className="card-head">
            <div><div className="card-tag">맥락 채팅</div><h2>미답변 질문 {totalUnanswered}건</h2></div>
          </div>
          <p className="desc">{enriched.filter((e) => e.unanswered > 0).map((e) => `${e.student.name} ${e.unanswered}건`).join(' · ')}</p>
          <div className="row"><Link href="/t/students" className="btn ghost sm">학생 탭에서 답변하기 →</Link></div>
        </div>
      )}

      {churnRisk.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(255,140,100,.35)' }}>
          <div className="card-head"><div><div className="card-tag" style={{ color: '#ff9d76' }}>이탈 신호</div><h2>이번 주 복습 0%</h2></div></div>
          <p className="desc">{churnRisk.map((e) => e.student.name).join(', ')} — 수업 첫 마디로 가볍게 언급해 보세요. 리액션 👏 한 번도 효과가 큽니다.</p>
        </div>
      )}

      {enrs.length === 0 && (
        <div className="empty">아직 학생이 없어요. <Link href="/t/students" style={{ color: 'var(--green)' }}>학생 탭</Link>에서 초대 링크를 만들어 카톡으로 보내보세요.</div>
      )}
    </>
  );
}
