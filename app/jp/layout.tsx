import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TabBar from '@/components/TabBar';

export const dynamic = 'force-dynamic';

export default function JpLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('jp_auth')?.value;
  if (!process.env.ACCESS_CODE || token !== process.env.ACCESS_CODE) {
    redirect('/login');
  }
  return (
    <>
      <div className="wrap">{children}</div>
      <TabBar />
    </>
  );
}
