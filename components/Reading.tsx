'use client';
import { useState } from 'react';

// 한글 발음 기본 표시 · 탭하면 히라가나 토글 (kana 없으면 그냥 표시)
export default function Reading({ ko, kana }: { ko: string; kana?: string }) {
  const [showKana, setShowKana] = useState(false);
  if (!ko && !kana) return null;
  if (!kana) return <span className="rd">{ko}</span>;
  return (
    <button type="button" className={`rd rd-toggle ${showKana ? 'kana' : ''}`}
      onClick={() => setShowKana(!showKana)}
      title="탭하면 한글 발음 ↔ 히라가나 전환">
      {showKana ? kana : ko} <span className="rd-hint">{showKana ? '가' : 'あ'}</span>
    </button>
  );
}
