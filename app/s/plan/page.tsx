import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { getUser, activeEnrollmentOf, parseSlots } from '@/lib/data';
import { slotLabel, formatKo, monthStr } from '@/lib/dates';
import Topbar from '@/components/Topbar';
import PhoneForm from '@/components/PhoneForm';

export const dynamic = 'force-dynamic';

const WON = (n: number) => n.toLocaleString('ko-KR') + '원';

export default async function Plan() {
  const sess = getSession()!;
  const s = db();
  const [me, enr] = await Promise.all([getUser(sess.id), activeEnrollmentOf(sess.id)]);
  const slots = parseSlots(enr?.slots);
  const m = monthStr();

  const [{ data: atts }, { data: invoices }] = enr
    ? await Promise.all([
        s.from('attendances').select('*').eq('enrollment_id', enr.id).gte('att_date', `${m}-01`).order('att_date', { ascending: false }),
        s.from('invoices').select('*').eq('enrollment_id', enr.id).order('month', { ascending: false }).limit(6),
      ])
    : [{ data: [] }, { data: [] }] as any;

  return (
    <>
      <Topbar name={me?.name} badge="학생" />
      <div className="eyebrow">Schedule &amp; Billing</div>
      <h1 className="big">일정과 <em>정산</em></h1>

      <div className="card">
        <div className="card-tag">정기 수업</div>
        {slots.length ? slots.map((x, i) => <p key={i} className="desc" style={{ marginTop: 8, color: 'var(--text)' }}>📅 {slotLabel(x)}</p>)
          : <p className="desc">아직 정기 일정이 없어요. 선생님이 설정하면 여기에 표시됩니다.</p>}
        {enr && <p className="hintline" style={{ marginTop: 10 }}>담당: {enr.teacher?.name} 선생님 · 요금 {enr.rate > 0 ? `${WON(enr.rate)} / ${enr.rate_type === 'monthly' ? '월' : '회'}` : '미설정'}</p>}
      </div>

      <div className="card">
        <div className="card-tag">이번 달 출석 ({m})</div>
        {(atts || []).length
          ? (atts || []).map((a: any) => <div key={a.id} className="inv-row"><span>{formatKo(String(a.att_date))}</span><span className="hintline">{a.source === 'auto' ? '노트 자동 기록' : '선생님 기록'}</span></div>)
          : <p className="desc">아직 출석 기록이 없어요. 수업 노트를 만들면 자동으로 기록돼요.</p>}
      </div>

      <div className="card">
        <div className="card-tag">정산서</div>
        {(invoices || []).length
          ? (invoices || []).map((v: any) => (
            <div key={v.id} className="inv-row">
              <span>{v.month} · {v.lesson_count}회</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <b>{WON(v.amount)}</b>
                <span className={`status-pill ${v.status}`}>{v.status === 'paid' ? '입금 완료' : v.status === 'sent' ? '입금 대기' : '작성 중'}</span>
              </span>
            </div>
          ))
          : <p className="desc">발행된 정산서가 없어요.</p>}
        <p className="hintline" style={{ marginTop: 10 }}>입금은 선생님 계좌로 직접 — 자세한 안내는 선생님이 보내드려요.</p>
      </div>

      <div className="card">
        <div className="card-tag">알림 수신</div>
        <PhoneForm initial={me?.phone || ''} />
      </div>
    </>
  );
}
