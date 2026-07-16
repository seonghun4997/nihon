import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default function ALayout({ children }: { children: React.ReactNode }) {
  const sess = getSession();
  if (!sess) redirect('/login');
  if (sess.role !== 'owner') redirect(sess.role === 'teacher' ? '/t' : '/s');
  return <div className="wrap" style={{ paddingBottom: 40 }}>{children}</div>;
}
