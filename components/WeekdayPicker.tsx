'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DAYS = ['일','월','화','수','목','금','토'];

export default function WeekdayPicker({ lang, initial }: { lang: 'jp' | 'en'; initial: number[] }) {
  const [days, setDays] = useState<number[]>(initial);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function toggle(i: number) {
    const next = days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort();
    setDays(next);
    await fetch('/api/s/prefs', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang, weekdays: next }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
    router.refresh();
  }

  return (
    <>
      <div className="day-chips">
        {DAYS.map((d, i) => (
          <button key={i} className={days.includes(i) ? 'on' : ''} onClick={() => toggle(i)}>{d}</button>
        ))}
      </div>
      <p className="hintline" style={{ marginTop: 8 }}>{saved ? '저장됐어요 ✓' : days.length ? `매주 ${days.map((i) => DAYS[i]).join('·')}요일` : '요일을 탭해서 켜세요'}</p>
    </>
  );
}
