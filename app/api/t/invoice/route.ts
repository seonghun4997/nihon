import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { monthStr } from '@/lib/dates';

// 월 정산서: 생성(출석 자동 집계) → 발송 표시 → 입금 확인
export async function POST(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'teacher') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { enrollment_id, month } = await req.json().catch(() => ({}));
  const m = month || monthStr();
  const s = db();

  const { data: enr } = await s.from('enrollments').select('*').eq('id', enrollment_id).maybeSingle();
  if (!enr || enr.teacher_id !== sess.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { count } = await s.from('attendances').select('id', { count: 'exact', head: true })
    .eq('enrollment_id', enr.id).gte('att_date', `${m}-01`).lte('att_date', `${m}-31`);
  const lessons = count || 0;
  const amount = enr.rate_type === 'monthly' ? enr.rate : enr.rate * lessons;

  const { data, error } = await s.from('invoices')
    .upsert({ enrollment_id: enr.id, month: m, lesson_count: lessons, amount }, { onConflict: 'enrollment_id,month' })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, invoice: data });
}

export async function PATCH(req: NextRequest) {
  const sess = getSession();
  if (!sess || sess.role !== 'teacher') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, status } = await req.json().catch(() => ({}));
  if (!['sent', 'paid', 'draft'].includes(status)) return NextResponse.json({ error: 'bad status' }, { status: 400 });
  const s = db();
  const { data: inv } = await s.from('invoices').select('id, enrollments!inner(teacher_id)').eq('id', id).maybeSingle();
  if (!inv || (inv as any).enrollments?.teacher_id !== sess.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const patch: any = { status };
  if (status === 'sent') patch.sent_at = new Date().toISOString();
  if (status === 'paid') patch.paid_at = new Date().toISOString();
  await s.from('invoices').update(patch).eq('id', id);
  return NextResponse.json({ ok: true });
}
