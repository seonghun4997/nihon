import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { streakOf } from '@/lib/data';
import { todayStr, addDaysStr, nowKST, dayOfWeekKST, DAY_KO } from '@/lib/dates';
import { getLang, langName } from '@/lib/lang';
import PasteBox from '@/components/PasteBox';
import TopicPicker from '@/components/TopicPicker';
import Topbar from '@/components/Topbar';
import GoalGauge from '@/components/GoalGauge';
import { prefOf } from '@/lib/prefs';

export const dynamic = 'force-dynamic';

export default async function Today() {
  const sess = getSession()!;
  const s = db();
  const today = todayStr();
  const lang = getLang();

  const [pref, streak] = await Promise.all([prefOf(lang), streakOf(sess.id)]);
  const weekdays: number[] = pref.weekdays;
  const d = dayOfWeekKST();
  const lesson = weekdays.includes(d);
  const beforeLesson = weekdays.includes((d + 1) % 7);
  const afterLesson = weekdays.includes((d + 6) % 7);

  const [{ count: dueWords }, { count: starred }, { data: talk }, { data: lastLesson }] = await Promise.all([
    s.from('words').select('id', { count: 'exact', head: true }).eq('student_id', sess.id).eq('lang', lang).eq('retired', false).lte('next_due', today),
    s.from('confusions').select('id', { count: 'exact', head: true }).eq('student_id', sess.id).eq('lang', lang).eq('resolved', false).gte('count', 2),
    s.from('talks').select('turns, done').eq('student_id', sess.id).eq('lang', lang).eq('talk_date', today).maybeSingle(),
    s.from('lessons').select('title, lesson_date').eq('student_id', sess.id).eq('lang', lang).order('lesson_date', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const reviewN = (dueWords || 0) + Math.min(starred || 0, 2);
  const now = nowKST();
  const dateLabel = `${now.getUTCMonth() + 1}월 ${now.getUTCDate()}일 ${DAY_KO[now.getUTCDay()]}요일`;

  const headline = lesson
    ? <>오늘은 {langName(lang)} 수업일.<br />끝나면 <em>붙여넣기 한 번</em>.</>
    : beforeLesson
    ? <>내일은 {langName(lang)} 수업일.<br />오늘 <em>10분</em>이면 준비 끝.</>
    : reviewN > 0
    ? <>오늘 몫은 <em>딱 {reviewN}개</em>.<br />10분이면 끝나요.</>
    : <>오늘 복습은 없어요.<br /><em>가볍게</em> 지나가는 날.</>;

  return (
    <>
      <Topbar lang={lang} />
      <div className="eyebrow">Today · {dateLabel}</div>
      <h1 className="big">{headline}</h1>
      {lastLesson && <div className="sub">최근 수업: {lastLesson.title}</div>}
      <GoalGauge studentId={sess.id} lang={lang} goal={pref.goal} />
      {weekdays.length === 0 && <div className="empty">⚙️ 설정 탭에서 {langName(lang)} 수업 요일을 먼저 선택해 주세요 — 수업일에 맞춰 홈이 바뀝니다.</div>}

      <div className="loop">
        <div className={`step ${reviewN > 0 ? 'now' : 'done'}`}>
          <div className="dot" />
          <div className={`card ${reviewN > 0 && !lesson ? 'hero' : ''}`}>
            <div className="card-head">
              <div><div className="card-tag">매일 아침</div><h2>오늘의 10분</h2></div>
              <span className={`chip ${reviewN > 0 ? '' : 'gray'}`}>{reviewN > 0 ? `복습 ${reviewN}개 대기` : '오늘 몫 없음'}</span>
            </div>
            {reviewN > 0 ? (
              <>
                <p className="desc">만기 단어 {dueWords || 0}개{(starred || 0) > 0 ? ` + ⭐헷갈림 ${Math.min(starred || 0, 2)}개` : ''}{lang === 'jp' ? ' + 가나 드릴' : ''}.</p>
                <div className="row"><Link href="/s/cards" className="btn block">복습 시작하기 →</Link></div>
              </>
            ) : (
              <p className="desc">{lang === 'jp' ? '복습 큐가 비었어요. 가나 드릴만 가볍게 돌려도 좋아요.' : '복습 큐가 비었어요.'}</p>
            )}
          </div>
        </div>

        <div className={`step ${lesson ? 'now' : ''}`}>
          <div className="dot" />
          <div className={`card ${lesson ? 'hero' : ''}`}>
            <div className="card-head">
              <div><div className="card-tag">{lesson ? '오늘 수업 끝나면' : '수업일에 커짐'}</div><h2>수업 노트 만들기</h2></div>
              {!lesson && <span className="chip gray">{weekdays.length ? weekdays.map((x) => DAY_KO[x]).join('·') : '요일 미설정'}</span>}
            </div>
            <p className="desc">다글로 녹음 → 텍스트 복사 → 붙여넣기 한 번이면 {langName(lang)} 표현·단어·문법·헷갈림으로 자동 분해.</p>
            <PasteBox />
          </div>
        </div>

        {beforeLesson && (
          <div className="step now">
            <div className="dot" />
            <div className="card">
              <div className="card-head"><div><div className="card-tag">수업 전날 밤</div><h2>내일 수업 주제 고르기</h2></div></div>
              <p className="desc">최근 수업 흐름에서 주제 3개를 뽑아요. [선생님께 공유]로 카톡 복사도 가능.</p>
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
            <p className="desc">최근 {langName(lang)} 수업 주제로 AI와 가볍게. 3턴만 해도 완료.</p>
            <div className="row"><Link href="/s/talk" className="btn ghost sm">{talk?.done ? '대화 다시 보기' : '대화 이어가기 →'}</Link></div>
          </div>
        </div>
      </div>
      <p className="hintline" style={{ marginTop: 18, textAlign: 'center' }}>연속 {streak}일 진행 중 (언어 합산)</p>
    </>
  );
}
