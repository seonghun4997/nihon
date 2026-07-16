import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default function Root() {
  redirect(getSession() ? '/s' : '/login');
}
