'use client';
import { useState } from 'react';

export default function ReactionButton({ enrollmentId }: { enrollmentId: string }) {
  const [sent, setSent] = useState(false);
  async function cheer() {
    if (sent) return;
    setSent(true);
    await fetch('/api/t/reaction', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId, emoji: '👏' }),
    });
  }
  return <button className="chip" onClick={cheer} title="학생 홈에 응원이 표시돼요">{sent ? '보냄 ✓' : '👏 응원'}</button>;
}
