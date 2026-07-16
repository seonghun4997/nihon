import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// 연락처(알림 수신용) 수정 — 학생·선생님 공용
export async function PATCH(req: NextRequest) {
  const sess = getSession();
  if (!sess) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { phone } = await req.json().catch(() => ({}));
  const { error } = await db().from('users').update({ phone: String(phone || '').trim() || null }).eq('id', sess.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
