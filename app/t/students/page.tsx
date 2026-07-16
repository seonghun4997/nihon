import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { teacherEnrollments, reviewRate7d, parseSlots } from '@/lib/data';
import { nextLessonDateFor, formatKo } from '@/lib/dates';
import Topbar from '@/components/Topbar';
import InviteButton from '@/components/InviteButton';
import ReactionButton from '@/components/ReactionButton';

export const dynamic = 'force-dynamic';

export default async function Students() {
  const sess = getSession()!;
  const s = db();
  const enrs = await teacherEnrollments(sess.id);

  const cards = await Promise.all(
    enrs.map(async (e) => {
      const sid = e.student.id;
      const [rate, { data: confs }, { count: unanswered }] = await Promise.all([
        reviewRate7d(sid),
        s.from('confusions').select('text, count').eq('student_id', sid).eq('resolved', false).gte('count', 2).order('count', { ascending: false }).limit(3),
        s.from('questions').select('id', { count: 'exact', head: true }).eq('enrollment_id', e.id).eq('ask_teacher', true).is('answered_at', null),
      ]);
      return { e, rate, confs: confs || [], unanswered: unanswered || 0 };
    })
  );

  return (
    <>
      <Topbar badge="선생님" />
      <div className="eyebrow">Students</div>
      <h1 className="big">학생 <em>{enrs.length}명</em></h1>
      <div className="row" style={{ marginTop: 14 }}><InviteButton /></div>

      <div className="stu-grid">
        {cards.map(({ e, rate, confs, unanswered }) => {
          const next = nextLessonDateFor(parseSlots(e.slots));
          return (
            <div key={e.id} className={`stu-card ${rate === 0 ? 'alert' : ''}`}>
              <div className="stu-head">
                <div className="avatar">{e.student.name.slice(0, 1)}</div>
                <div>
                  <b>{e.student.name}</b>
                  <div className="sub2">{next ? `다음 수업 ${formatKo(next)}` : '정기 일정 미설정'}{e.status === 'paused' ? ' · 일시정지' : ''}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <ReactionButton enrollmentId={e.id} />
                  <Link href={`/t/students/${e.id}`} className="chip gray">상세 →</Link>
                </div>
              </div>
              <div className="stu-stats">
                <span className={`stat ${rate >= 50 ? 'good' : rate === 0 ? 'warn' : ''}`}>주간 복습 <b>{rate}%</b></span>
                <span className={`stat ${unanswered > 0 ? 'warn' : ''}`}>미답변 <b>{unanswered}</b></span>
                {confs.slice(0, 2).map((c: any, i: number) => <span key={i} className="stat">⭐ {c.text.slice(0, 14)}{c.text.length > 14 ? '…' : ''}</span>)}
              </div>
            </div>
          );
        })}
        {enrs.length === 0 && <div className="empty">초대 링크를 만들어 학생에게 카톡으로 보내면, 가입 즉시 여기에 나타나요.</div>}
      </div>
    </>
  );
}
