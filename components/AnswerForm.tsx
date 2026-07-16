'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnswerForm({ questionId }: { questionId: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true);
    await fetch('/api/t/answer', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: questionId, answer: text }),
    });
    router.refresh();
  }
  return (
    <div className="answer-box">
      <input placeholder="답변 달기 — 학생 질문 탭에 바로 표시돼요" value={text}
        onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
      <button className="btn sm" onClick={send} disabled={busy}>{busy ? '…' : '답변'}</button>
    </div>
  );
}
