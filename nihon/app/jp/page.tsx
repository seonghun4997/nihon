import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getStreak } from '@/lib/streak';
import { todayStr, addDaysStr, isLessonDay, isDayBeforeLesson, isDayAfterLesson, nowKST } from '@/lib/dates';
import PasteBox from '@/components/PasteBox';
import TopicPicker from '@/components/TopicPicker';

export const dynamic = 'force-dynamic';

export default async function Today() {
  const s = db();
  const today = todayStr();

  const [{ count: dueWords }, { count: starred }, { data: talk }, streak, { data: lastLesson }] =
    await Promise.all([
      s.from('jp_words').select('id', { count: 'exact', head: true }).eq('retired', false).lte('next_due', today),
      s.from('jp_confusions').select('id', { count: 'exact', head: true }).eq('resolved', false).gte('count', 2),
      s.from('jp_talks').select('turns, done').eq('talk_date', today).maybeSingle(),
      getStreak(),
      s.from('jp_lessons').select('title, lesson_date').order('lesson_date', { ascending: false }).limit(1).maybeSingle(),
    ]);

  const reviewN = (dueWords || 0) + Math.min(starred || 0, 2);
  const lesson = isLessonDay();
  const beforeLesson = isDayBeforeLesson();
  const afterLesson = isDayAfterLesson();

  const d = nowKST();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dateLabel = `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${dayNames[d.getUTCDay()]}요일`;

  const headline = lesson
    ? <>오늘은 수업일.<br />끝나면 <em>붙여넣기 한 번</em>.</>
    : beforeLesson
    ? <>내일은 수업일.<br />오늘 <em>10분</em>이면 준비 끝.</>
    : reviewN > 0
    ? <>오늘 몫은 <em>딱 {reviewN}개</em>.<br />10분이면 끝나요.</>
    : <>오늘 복습은 없어요.<br /><em>가볍게</em> 지나가는 날.</>;

  return (
    <>
      <header className="topbar">
        <div className="gem" /> <b>JP HUB</b>
        <span className="streak">연속 <b>{streak}일</b></span>
      </header>

      <div className="eyebrow">Today · {dateLabel}</div>
      <h1 className="big">{headline}</h1>
      {lastLesson && (
        <div className="sub">최근 수업: {lastLesson.title} — 오늘도 루프를 한 칸만 돌리면 돼요.</div>
      )}

      <div className="loop">
        {/* ① 오늘의 10분 — 매일 */}
        <div className={`step ${reviewN > 0 ? 'now' : 'done'}`}>
          <div className="dot" />
          <div className={`card ${reviewN > 0 ? 'hero' : ''}`}>
            <div className="card-head">
              <div>
                <div className="card-tag">매일 아침</div>
                <h2>오늘의 10분</h2>
              </div>
              <span className={`chip ${reviewN > 0 ? '' : 'gray'}`}>
                {reviewN > 0 ? `복습 ${reviewN}개 대기` : '오늘 몫 없음'}
              </span>
            </div>
            {reviewN > 0 ? (
              <>
                <p className="desc">만기 단어 {dueWords || 0}개{(starred || 0) > 0 ? ` + ⭐헷갈림 ${Math.min(starred || 0, 2)}개` : ''} + 가나 드릴. 끝나면 오늘 몫은 끝.</p>
                <div className="row">
                  <Link href="/jp/cards" className="btn block">복습 시작하기 →</Link>
                </div>
              </>
            ) : (
              <p className="desc">복습 큐가 비었어요. 가나 드릴만 가볍게 돌려도 좋아요.</p>
            )}
          </div>
        </div>

        {/* ② 수업 노트 만들기 — 수업일에만 크게 */}
        <div className={`step ${lesson ? 'now' : ''}`}>
          <div className="dot" />
          <div className={`card ${lesson ? 'hero' : ''}`}>
            <div className="card-head">
              <div>
                <div className="card-tag">{lesson ? '오늘 수업 끝나면' : '수업일 (화·금)에 열림'}</div>
                <h2>수업 노트 만들기</h2>
              </div>
              {!lesson && <span className="chip gray">화·금</span>}
            </div>
            {lesson ? (
              <PasteBox />
            ) : (
              <p className="desc">수업일 저녁에 이 칸이 커집니다. 다글로 텍스트 붙여넣기 한 번이면 자동 분해.</p>
            )}
          </div>
        </div>

        {/* ③ 내일 수업 주제 — 전날에만 */}
        {beforeLesson && (
          <div className="step now">
            <div className="dot" />
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-tag">수업 전날 밤</div>
                  <h2>내일 수업 주제 고르기</h2>
                </div>
                <span className="chip">밤 9시 문자로도 와요</span>
              </div>
              <p className="desc">최근 수업 흐름에서 주제 3개를 뽑아요. 하나를 고르면 예습 카드가 됩니다.</p>
              <TopicPicker forDate={addDaysStr(today, 1)} />
            </div>
          </div>
        )}

        {/* ④ 이어하기 회화 — 수업 다음날 제안 */}
        <div className={`step ${talk?.done ? 'done' : afterLesson ? 'now' : ''}`}>
          <div className="dot" />
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-tag">수업 사이 발화량</div>
                <h2>이어하기 회화</h2>
              </div>
              <span className={`chip ${talk?.done ? '' : 'gray'}`}>
                {talk?.done ? '오늘 완료 ✓' : talk ? `${talk.turns} / 3턴` : '3턴이면 완료'}
              </span>
            </div>
            <p className="desc">
              {afterLesson
                ? '어제 수업 주제로 이어서 대화해 보세요. 배운 표현을 쓰면 ✓가 붙어요.'
                : '최근 수업 주제로 AI와 가볍게. 3턴만 해도 오늘 완료.'}
            </p>
            <div className="row">
              <Link href="/jp/talk" className="btn ghost sm">{talk?.done ? '대화 다시 보기' : '대화 이어가기 →'}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
