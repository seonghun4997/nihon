'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Att = { id: string; att_date: string; source: string };

export default function AttendanceControls({ enrollmentId, attendances }: { enrollmentId: string; attendances: Att[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const days = ['일','월','화','수','목','금','토'];
  const fmt = (d: string) => { const x = new Date(d + 'T00:00:00Z'); return `${x.getUTCMonth() + 1}/${x.getUTCDate()} (${days[x.getUTCDay()]})`; };

  async function add() {
    setBusy(true);
    await fetch('/api/t/attendance', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    });
    setBusy(false); router.refresh();
  }
  async function remove(id: string) {
    await fetch('/api/t/attendance', {
      method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <>
      {attendances.map((a) => (
        <div key={a.id} className="inv-row">
          <span>{fmt(a.att_date)} <span className="hintline">{a.source === 'auto' ? '노트 자동' : '수동'}</span></span>
          <button className="icon-x" onClick={() => remove(a.id)} title="삭제">✕</button>
        </div>
      ))}
      {attendances.length === 0 && <p className="desc">노트가 만들어지면 자동 기록돼요.</p>}
      <div className="row"><button className="btn ghost sm" onClick={add} disabled={busy}>+ 오늘 수업 수동 기록 (노트 없이 진행한 경우)</button></div>
    </>
  );
}
