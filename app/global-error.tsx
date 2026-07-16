'use client';
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko"><body style={{ background: '#0b0b0d', color: '#ececf0', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 14 }}>
      <b>NIHON — 잠깐 멈췄어요</b>
      <button onClick={() => reset()} style={{ background: '#3EDD8C', border: 0, borderRadius: 999, padding: '12px 24px', fontWeight: 800 }}>다시 시도</button>
      <a href="/s" style={{ color: '#3EDD8C', fontSize: 13 }}>홈으로</a>
    </body></html>
  );
}
