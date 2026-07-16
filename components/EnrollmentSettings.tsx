'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Slot = { weekday: number; time: string; mode: 'online' | 'offline'; place?: string };
type Init = { rate: number; rate_type: string; slots: Slot[]; status: string; memo: string };
const DAYS = ['일','월','화','수','목','금','토'];

export default function EnrollmentSettings({ enrollmentId, initial }: { enrollmentId: string; initial: Init }) {
  const [rate, setRate] = useState(String(initial.rate || ''));
  const [rateType, setRateType] = useState(initial.rate_type || 'per_lesson');
  const [slots, setSlots] = useState<Slot[]>(initial.slots || []);
  const [status, setStatus] = useState(initial.status || 'active');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function setSlot(i: number, patch: Partial<Slot>) {
    setSlots(slots.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  async function save() {
    setBusy(true);
    await fetch('/api/t/enrollment', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: enrollmentId, rate: parseInt(rate) || 0, rate_type: rateType, slots, status }),
    });
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <>
      <div className="field">
        <label>요금</label>
        <div className="row2">
          <input inputMode="numeric" placeholder="예: 50000" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^0-9]/g, ''))} />
          <select value={rateType} onChange={(e) => setRateType(e.target.value)}>
            <option value="per_lesson">회당</option>
            <option value="monthly">월정액</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>정기 일정 — 리마인드·주제카드·브리핑이 이 시계로 돌아요</label>
        {slots.map((s, i) => (
          <div key={i} className="slot-row">
            <select value={s.weekday} onChange={(e) => setSlot(i, { weekday: Number(e.target.value) })}>
              {DAYS.map((d, j) => <option key={j} value={j}>매주 {d}</option>)}
            </select>
            <input type="time" value={s.time} onChange={(e) => setSlot(i, { time: e.target.value })} />
            <select value={s.mode} onChange={(e) => setSlot(i, { mode: e.target.value as any })}>
              <option value="online">비대면</option>
              <option value="offline">대면</option>
            </select>
            <input className="place" placeholder={s.mode === 'online' ? '구글밋/줌 링크' : '장소'} value={s.place || ''} onChange={(e) => setSlot(i, { place: e.target.value })} />
            <button className="icon-x" onClick={() => setSlots(slots.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn ghost sm" onClick={() => setSlots([...slots, { weekday: 2, time: '20:00', mode: 'online', place: '' }])}>+ 슬롯 추가</button>
        </div>
      </div>

      <div className="field">
        <label>상태</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">진행 중</option>
          <option value="paused">일시정지</option>
          <option value="ended">종료</option>
        </select>
      </div>

      <div className="row"><button className="btn block" onClick={save} disabled={busy}>{busy ? '저장 중…' : saved ? '저장됐어요 ✓' : '설정 저장'}</button></div>
    </>
  );
}
