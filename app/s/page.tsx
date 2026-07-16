import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { getUser, activeEnrollmentOf, streakOf, parseSlots } from '@/lib/data';
import { todayStr, addDaysStr, nowKST, isLessonDayFor, isDayBeforeLessonFor, isDayAfterLessonFor, DAY_KO } from '@/lib/dates';
import PasteBox from '@/components/PasteBox';
import TopicPicker from '@/components/TopicPicker';
import Topbar from '@/components/Topbar';

export const dynamic = 'force-dynamic';

export default async function StudentToday() {
  const sess = getSession()!;
  const s = db();
  const today = todayStr();

  const [me, enr, streak] = await Promise.all([getUser(sess.id), activeEnrollmentOf(sess.id), streakOf(sess.id)]);
  const slots = parseSlots(enr?.slots);
  const lesson = isLessonDayFor(slots);
  const beforeLesson = isDayBeforeLessonFor(slots);
  const afterLesson = isDayAfterLessonFor(slots);

  const [{ count: dueWords }, { count: starred }, { data: talk }, { data: lastLesson }, { count: cheers }] = await Promise.all([
    s.from('words').select('id', { count: 'exact', head: true }).eq('student_id', sess.id).eq('retired', false).lte('next_due', today),
    s.from('confusions').select('id', { count: 'exact', head: true }).eq('student_id', sess.id).eq('resolved', false).gte('count', 2),
    s.from('talks').select('turns, done').eq('student_id', sess.id).eq('talk_date', today).maybeSingle(),
    s.from('lessons').select('title, lesson_date').eq('student_id', sess.id).order('lesson_date', { ascending: false }).limit(1).maybeSingle(),
    s.from('reactions').select('id', { count: 'exact', head: true }).eq('student_id', sess.id).gte('created_at', addDaysStr(today, -6) + 'T00:00:00'),
  ]);

  const reviewN = (dueWords || 0) + Math.min(starred || 0, 2);
  const d = nowKST();
  const dateLabel = `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${DAY_KO[d.getUTCDay()]}요일`;

  const headline = lesson
    ? <>오늘은 수업일.<br />끝나면 <em>붙여넣기 한 번</em>.</>
    : beforeLesson
    ? <>내일은 수업일.<br />오늘 <em>10분</em>이면 준비 끝.</>
    : reviewN > 0
    ? <>오늘 몫은 <em>딱 {reviewN}개</em>.<br />10분이면 끝나요.</>
    : <>오늘 복습은 없어요.<br /><em>가볍게</em> 지나가는 날.</>;

  return (
    <>
      <Topbar name={me?.name} badge="학생" />
      <div className="eyebrow">Today · {dateLabel}{enr ? ` · ${enr.teacher?.name} 선생님` : ''}</div>
      <h1 className="big">{headline}</h1>
      {lastLesson && <div className="sub">최근 수업: {lastLesson.title}</div>}
      {(cheers || 0) > 0 && <div className="reaction-banner">👏 이번 주 선생님이 회원님의 복습에 {cheers}번 박수를 보냈어요</div>}
      {!enr && <div className="empty">아직 연결된 선생님이 없어요. 선생님께 초대 링크를 요청해 주세요.</div>}

      <div className="loop">
        <div className={`step ${reviewN > 0 ? 'now' : 'done'}`}>
          <div className="dot" />
          <div className={`card ${reviewN > 0 ? 'hero' : ''}`}>
            <div className="card-head">
              <div><div className="card-tag">매일 아침</div><h2>오늘의 10분</h2></div>
              <span className={`chip ${reviewN > 0 ? '' : 'gray'}`}>{reviewN > 0 ? `복습 ${reviewN}개 대기` : '오늘 몫 없음'}</span>
            </div>
            {reviewN > 0 ? (
              <>
                <p className="desc">만기 단어 {dueWords || 0}개{(starred || 0) > 0 ? ` + ⭐헷갈림 ${Math.min(starred || 0, 2)}개` : ''} + 가나 드릴. 복습 현황은 선생님께도 보여요.</p>
                <div className="row"><Link href="/s/cards" className="btn block">복습 시작하기 →</Link></div>
              </>
            ) : (
              <p className="desc">복습 큐가 비었어요. 가나 드릴만 가볍게 돌려도 좋아요.</p>
            )}
          </div>
        </div>

        <div className={`step ${lesson ? 'now' : ''}`}>
          <div className="dot" />
          <div className={`card ${lesson ? 'hero' : ''}`}>
            <div className="card-head">
              <div><div className="card-tag">{lesson ? '오늘 수업 끝나면' : '수업일에 열림'}</div><h2>수업 노트 만들기</h2></div>
              {!lesson && <span className="chip gray">{slots.length ? slots.map((x) => DAY_KO[x.weekday]).join('·') : '일정 미설정'}</span>}
            </div>
            {lesson ? <PasteBox /> : <p className="desc">수업일 저녁에 이 칸이 커집니다. 붙여넣기 한 번이면 자동 분해 + 출석 기록.</p>}
          </div>
        </div>

        {beforeLesson && (
          <div className="step now">
            <div className="dot" />
            <div className="card">
              <div className="card-head">
                <div><div className="card-tag">수업 전날 밤</div><h2>내일 수업 주제 고르기</h2></div>
              </div>
              <p className="desc">최근 수업 흐름에서 주제 3개를 뽑아요. 고르면 선생님 브리핑에도 자동으로 들어갑니다.</p>
              <TopicPicker forDate={addDaysStr(today, 1)} />
            </div>
          </div>
        )}

        <div className={`step ${talk?.done ? 'done' : afterLesson ? 'now' : ''}`}>
          <div className="dot" />
          <div className="card">
            <div className="card-head">
              <div><div className="card-tag">수업 사이 발화량</div><h2>이어하기 회화</h2></div>
              <span className={`chip ${talk?.done ? '' : 'gray'}`}>{talk?.done ? '오늘 완료 ✓' : talk ? `${talk.turns} / 3턴` : '3턴이면 완료'}</span>
            </div>
            <p className="desc">{afterLesson ? '어제 수업 주제로 이어서 대화해 보세요.' : '최근 수업 주제로 AI와 가볍게. 3턴만 해도 완료.'}</p>
            <div className="row"><Link href="/s/talk" className="btn ghost sm">{talk?.done ? '대화 다시 보기' : '대화 이어가기 →'}</Link></div>
          </div>
        </div>
      </div>
      <p className="hintline" style={{ marginTop: 18, textAlign: 'center' }}>연속 {streak}일 진행 중</p>
    </>
  );
}
