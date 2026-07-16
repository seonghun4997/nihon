import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'owner') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const { error } = await db().from('users').update({ approved: true }).eq('id', id).eq('role', 'teacher');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
