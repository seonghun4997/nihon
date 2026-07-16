import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import TabBar from '@/components/TabBar';
import { ensureSeed } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export default async function SLayout({ children }: { children: React.ReactNode }) {
  if (!getSession()) redirect('/login');
  await ensureSeed(); // 초기 데이터(오너 행·요일 기본값) 자동 보장
  return (
    <>
      <div className="wrap">{children}</div>
      <TabBar />
    </>
  );
}
