// 서버 컴포넌트 — 목표 진척 게이지 (막힘없이 = 몸에 밴 표현 수)
import { db } from '@/lib/supabase';
import { addDaysStr, todayStr } from '@/lib/dates';

const TARGET = 100; // 여행 생존 회화 통설: 표현 ~100개
const MILES = [
  { at: 30, label: '생존' },
  { at: 60, label: '여유' },
  { at: 100, label: '막힘없음' },
];

function levelOf(n: number) {
  if (n >= 100) return '막힘없음 달성 🎉';
  if (n >= 60) return '여유 단계';
  if (n >= 30) return '생존 회화 확보';
  return '생존 회화 만드는 중';
}

export default async function GoalGauge({ studentId, lang, goal }: { studentId: string; lang: 'jp' | 'en'; goal: string }) {
  const s = db();
  const weekAgo = addDaysStr(todayStr(), -7) + 'T00:00:00';

  const [
    { count: wMet }, { count: spMet },
    { count: wRev }, { count: spRev },
    { count: spSpoken },
    { count: wDone }, { count: spDone },
    { count: weekNew },
  ] = await Promise.all([
    s.from('words').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('lang', lang),
    s.from('speaks').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('lang', lang),
    s.from('words').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('lang', lang).gte('stage', 1).eq('retired', false),
    s.from('speaks').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('lang', lang).gte('stage', 1).eq('retired', false),
    s.from('speaks').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('lang', lang).gte('stage', 1),
    s.from('words').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('lang', lang).eq('retired', true),
    s.from('speaks').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('lang', lang).eq('retired', true),
    s.from('words').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('lang', lang).gte('created_at', weekAgo),
  ]);

  const met = (wMet || 0) + (spMet || 0);
  const reviewing = (wRev || 0) + (spRev || 0);
  const spoken = spSpoken || 0;
  const mastered = (wDone || 0) + (spDone || 0);
  const score = mastered + spoken; // 입으로 통과 + 몸에 뱀 = "막힘없이" 진척
  const pct = Math.min(Math.round((score / TARGET) * 100), 100);

  return (
    <div className="goal-card">
      <div className="goal-head">
        <span className="g-title">🎯 {goal}</span>
        <span className="g-week">{(weekNew || 0) > 0 ? `이번 주 새 표현 +${weekNew}` : ''}</span>
      </div>
      <div className="goal-big"><b>{score}</b><span>/ {TARGET} · {levelOf(score)}</span></div>
      <div className="goal-bar"><i style={{ width: `${pct}%` }} /></div>
      <div className="goal-marks">
        <span>0</span>
        {MILES.map((m) => <span key={m.at} className={score >= m.at ? 'hit' : ''}>{m.at} {m.label}</span>)}
      </div>
      <div className="funnel">
        <div className={`fstep ${met > 0 ? 'lit' : ''}`}><b>{met}</b><span>만난 표현</span></div>
        <div className={`fstep ${reviewing > 0 ? 'lit' : ''}`}><b>{reviewing}</b><span>복습 중</span></div>
        <div className={`fstep ${spoken > 0 ? 'lit' : ''}`}><b>{spoken}</b><span>입으로 통과</span></div>
        <div className={`fstep ${mastered > 0 ? 'lit' : ''}`}><b>{mastered}</b><span>몸에 뱀 D21</span></div>
      </div>
    </div>
  );
}
