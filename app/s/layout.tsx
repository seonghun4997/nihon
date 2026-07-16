import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import TabBar from '@/components/TabBar';

export const dynamic = 'force-dynamic';

export default function SLayout({ children }: { children: React.ReactNode }) {
  if (!getSession()) redirect('/login');
  return (
    <>
      <div className="wrap">{children}</div>
      <TabBar />
    </>
  );
}
