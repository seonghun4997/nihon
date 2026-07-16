import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import TabBar from '@/components/TabBar';

export const dynamic = 'force-dynamic';

export default function SLayout({ children }: { children: React.ReactNode }) {
  const sess = getSession();
  if (!sess) redirect('/login');
  if (sess.role === 'teacher') redirect('/t');
  if (sess.role === 'owner') redirect('/a');
  return (
    <>
      <div className="wrap">{children}</div>
      <TabBar role="student" />
    </>
  );
}
