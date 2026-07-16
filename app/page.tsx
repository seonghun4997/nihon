import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default function Landing() {
  const sess = getSession();
  if (sess?.role === 'student') redirect('/s');
  if (sess?.role === 'teacher') redirect('/t');
  if (sess?.role === 'owner') redirect('/a');

  return (
    <div className="landing">
      <header className="topbar" style={{ padding: '0 0 40px' }}>
        <div className="gem" /> <b>NIHON</b>
        <div className="right"><Link className="linkbtn" href="/login">로그인</Link></div>
      </header>

      <div className="hero">
        <div className="eyebrow">일본어 과외 OS</div>
        <h1>수업 녹음 한 번이면<br /><em>교재·복습·정산</em>이 따라온다</h1>
        <p>선생님은 가르치는 일만 하세요. 수업이 끝나면 녹음 텍스트를 붙여넣기 — 학생별 교재, 매일 복습, 다음 수업 준비, 월말 정산까지 자동입니다.</p>
        <div className="cta">
          <Link href="/signup" className="btn">선생님으로 시작하기 →</Link>
          <Link href="/login" className="btn ghost">로그인</Link>
        </div>
        <p style={{ fontSize: 12.5, marginTop: 14, color: 'var(--dim)' }}>학생은 선생님의 초대 링크로 시작해요 · 지금은 전부 무료</p>
      </div>

      <div className="section-gap">
        <div className="floor"><span className="n">01</span><div><b>수업이 교재가 된다</b><p>녹음 텍스트를 AI가 표현·단어·문법·헷갈림으로 자동 분해. 학생만의 교재가 매 수업 쌓입니다.</p></div></div>
        <div className="floor"><span className="n">02</span><div><b>복습이 저절로 돈다</b><p>매일 10분 복습 큐 + 헷갈림 재출제 + AI 회화. 학생의 복습 현황이 선생님 대시보드에 자동 반영.</p></div></div>
        <div className="floor"><span className="n">03</span><div><b>준비 0분, 정산 0분</b><p>수업 1시간 전 브리핑 자동 생성. 노트 생성 = 출석 기록 → 월말 정산서까지 자동.</p></div></div>
      </div>
    </div>
  );
}
