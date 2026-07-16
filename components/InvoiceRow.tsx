'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Inv = { id: string; amount: number; lesson_count: number; status: string } | null;
const WON = (n: number) => n.toLocaleString('ko-KR') + '원';

export default function InvoiceRow(props: {
  enrollmentId: string; name: string; month: string; lessons: number; expected: number; rateSet: boolean; invoice: Inv;
}) {
  const { enrollmentId, name, month, lessons, expected, rateSet } = props;
  const [invoice, setInvoice] = useState<Inv>(props.invoice);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function create() {
    setBusy(true);
    const res = await fetch('/api/t/invoice', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId, month }),
    });
    const d = await res.json();
    if (res.ok) setInvoice(d.invoice);
    setBusy(false);
  }
  async function mark(status: string) {
    if (!invoice) return;
    setBusy(true);
    await fetch('/api/t/invoice', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: invoice.id, status }),
    });
    setInvoice({ ...invoice, status });
    setBusy(false); router.refresh();
  }

  return (
    <div className="inv-row">
      <span><b>{name}</b> <span className="hintline">{invoice ? `${invoice.lesson_count}회 · ${WON(invoice.amount)}` : `${lessons}회 · 예상 ${WON(expected)}`}</span></span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {!invoice && <button className="chip" onClick={create} disabled={busy || !rateSet} title={rateSet ? '' : '먼저 학생 상세에서 요금을 설정하세요'}>{rateSet ? '정산서 만들기' : '요금 미설정'}</button>}
        {invoice?.status === 'draft' && <><span className="status-pill draft">작성됨</span><button className="chip" onClick={() => mark('sent')} disabled={busy}>발송 표시</button></>}
        {invoice?.status === 'sent' && <><span className="status-pill sent">입금 대기</span><button className="chip" onClick={() => mark('paid')} disabled={busy}>입금 확인</button></>}
        {invoice?.status === 'paid' && <span className="status-pill paid">입금 완료</span>}
      </span>
    </div>
  );
}
