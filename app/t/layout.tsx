import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getUser } from '@/lib/data';
import TabBar from '@/components/TabBar';

export const dynamic = 'force-dynamic';

export default async function TLayout({ children }: { children: React.ReactNode }) {
  const sess = getSession();
  if (!sess) redirect('/login');
  if (sess.role === 'student') redirect('/s');
  if (sess.role === 'owner') redirect('/a');

  const me = await getUser(sess.id);
  if (!me?.approved) {
    return (
      <div className="login">
        <div className="topbar" style={{ padding: 0 }}><div className="gem" /> <b>NIHON</b></div>
        <h1>승인 <em>대기 중</em></h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', textAlign: 'center', maxWidth: 320 }}>
          가입이 접수됐어요. 운영자 승인이 완료되면 학생 초대와 대시보드가 열립니다. 보통 하루 안에 처리돼요.
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="wrap">{children}</div>
      <TabBar role="teacher" />
    </>
  );
}
