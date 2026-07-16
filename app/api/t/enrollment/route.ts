import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// 요금·정기 슬롯·상태 설정 (일정의 원천 — 학습 루프의 시계)
export async function PATCH(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'teacher') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, rate, rate_type, slots, status, memo } = await req.json().catch(() => ({}));
  const s = db();
  const { data: enr } = await s.from('enrollments').select('id, teacher_id').eq('id', id).maybeSingle();
  if (!enr || enr.teacher_id !== sess.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const patch: any = {};
  if (rate !== undefined) patch.rate = Math.max(0, parseInt(rate) || 0);
  if (rate_type && ['per_lesson', 'monthly'].includes(rate_type)) patch.rate_type = rate_type;
  if (Array.isArray(slots)) {
    patch.slots = slots
      .filter((x: any) => x && x.weekday >= 0 && x.weekday <= 6 && /^\d{2}:\d{2}$/.test(x.time || ''))
      .map((x: any) => ({ weekday: Number(x.weekday), time: x.time, mode: x.mode === 'offline' ? 'offline' : 'online', place: String(x.place || '').slice(0, 200) }));
  }
  if (status && ['active', 'paused', 'ended'].includes(status)) patch.status = status;
  if (memo !== undefined) patch.memo = String(memo).slice(0, 1000);

  const { error } = await s.from('enrollments').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
