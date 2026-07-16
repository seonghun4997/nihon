'use client';
import { useState } from 'react';

export default function GoalForm({ lang, initial }: { lang: 'jp' | 'en'; initial: string }) {
  const [goal, setGoal] = useState(initial);
  const [saved, setSaved] = useState(false);
  async function save() {
    await fetch('/api/s/prefs', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang, goal }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="answer-box" style={{ marginTop: 12 }}>
      <input placeholder="학습 목표 한 줄 — 모든 AI가 이 문장을 향해 조준돼요" value={goal} onChange={(e) => setGoal(e.target.value)} />
      <button className="btn sm" onClick={save}>{saved ? '저장됨 ✓' : '저장'}</button>
    </div>
  );
}
