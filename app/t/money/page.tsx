import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { teacherEnrollments } from '@/lib/data';
import { monthStr } from '@/lib/dates';
import Topbar from '@/components/Topbar';
import InvoiceRow from '@/components/InvoiceRow';

export const dynamic = 'force-dynamic';

const WON = (n: number) => n.toLocaleString('ko-KR') + '원';

export default async function Money() {
  const sess = getSession()!;
  const s = db();
  const m = monthStr();
  const enrs = await teacherEnrollments(sess.id);

  const rows = await Promise.all(
    enrs.map(async (e) => {
      const [{ count }, { data: invoice }] = await Promise.all([
        s.from('attendances').select('id', { count: 'exact', head: true }).eq('enrollment_id', e.id).gte('att_date', `${m}-01`).lte('att_date', `${m}-31`),
        s.from('invoices').select('*').eq('enrollment_id', e.id).eq('month', m).maybeSingle(),
      ]);
      const lessons = count || 0;
      const expected = e.rate_type === 'monthly' ? e.rate : e.rate * lessons;
      return { e, lessons, expected, invoice };
    })
  );

  const totalExpected = rows.reduce((a, r) => a + r.expected, 0);
  const totalPaid = rows.reduce((a, r) => a + (r.invoice?.status === 'paid' ? r.invoice.amount : 0), 0);

  return (
    <>
      <Topbar badge="선생님" />
      <div className="eyebrow">Money · {m}</div>
      <h1 className="big">이번 달 <em>정산</em></h1>

      <div className="card hero">
        <div className="card-tag">이번 달 수입</div>
        <div className="money-big" style={{ marginTop: 8 }}>{WON(totalPaid)} <small>확정 / 예상 {WON(totalExpected)}</small></div>
        <p className="hintline" style={{ marginTop: 8 }}>출석은 수업 노트에서 자동 집계 — 정산서를 만들고, 학생에게 보내고, 입금을 확인하세요.</p>
      </div>

      <div className="card">
        <div className="card-tag">학생별 정산</div>
        {rows.map(({ e, lessons, expected, invoice }) => (
          <InvoiceRow key={e.id} enrollmentId={e.id} name={e.student.name} month={m}
            lessons={lessons} expected={expected}
            rateSet={e.rate > 0}
            invoice={invoice ? { id: invoice.id, amount: invoice.amount, lesson_count: invoice.lesson_count, status: invoice.status } : null} />
        ))}
        {rows.length === 0 && <p className="desc">학생이 생기면 여기서 정산해요.</p>}
      </div>
      <p className="hintline" style={{ textAlign: 'center', marginTop: 14 }}>입금은 내 계좌로 직접 받는 방식이에요 — nihon은 돈을 중개하지 않아요.</p>
    </>
  );
}
