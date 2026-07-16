'use client';
// 화면 오류 시 검은 화면 대신 복구 안내
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="login">
      <div className="topbar" style={{ padding: 0 }}><div className="gem" /> <b>NIHON</b></div>
      <h1>잠깐 <em>멈췄어요</em></h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', maxWidth: 300 }}>
        화면을 그리다 문제가 생겼어요. 아래 버튼으로 다시 시도해 주세요. 반복되면 어느 화면에서 났는지 알려주시면 바로 고칩니다.
      </p>
      <button className="btn" onClick={() => reset()}>다시 시도 →</button>
      <a href="/s" style={{ fontSize: 12.5, color: 'var(--green)' }}>홈으로 가기</a>
    </div>
  );
}
