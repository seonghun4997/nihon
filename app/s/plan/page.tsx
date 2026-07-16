import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { getLang } from '@/lib/lang';
import Topbar from '@/components/Topbar';
import WeekdayPicker from '@/components/WeekdayPicker';
import GoalForm from '@/components/GoalForm';
import PhoneForm from '@/components/PhoneForm';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  getSession();
  const s = db();
  const lang = getLang();
  const [{ data: prefs }, { data: me }] = await Promise.all([
    s.from('jp_prefs').select('*'),
    s.from('users').select('phone').eq('id', '00000000-0000-0000-0000-000000000001').maybeSingle(),
  ]);
  const pj = (prefs || []).find((p) => p.lang === 'jp') as any;
  const pe = (prefs || []).find((p) => p.lang === 'en') as any;
  const jp = pj?.weekdays || [];
  const en = pe?.weekdays || [];
  const DEFAULT_GOAL = '여행 가서 막힘없이 일상 대화';

  return (
    <>
      <Topbar lang={lang} />
      <div className="eyebrow">Settings</div>
      <h1 className="big">수업 <em>요일</em></h1>
      <div className="sub">요일을 켜두면 수업일·전날·다음날에 홈 카드와 문자가 그 시계로 돌아갑니다.</div>

      <div className="card">
        <div className="card-tag">🇯🇵 일본어 — 수업 요일 · 학습 목표</div>
        <WeekdayPicker lang="jp" initial={jp} />
        <GoalForm lang="jp" initial={pj?.goal || DEFAULT_GOAL} />
      </div>
      <div className="card">
        <div className="card-tag">🇬🇧 영어 — 수업 요일 · 학습 목표</div>
        <WeekdayPicker lang="en" initial={en} />
        <GoalForm lang="en" initial={pe?.goal || DEFAULT_GOAL} />
      </div>
      <div className="card">
        <div className="card-tag">알림 수신 번호 (아침 복습 · 전날 주제 문자)</div>
        <PhoneForm initial={me?.phone === '00000000000' ? '' : (me?.phone || '')} />
      </div>
    </>
  );
}
