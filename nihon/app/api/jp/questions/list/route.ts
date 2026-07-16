import { isAuthed } from '@/lib/guard';
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = db();
  const { data } = await s.from('jp_questions').select('*').order('created_at', { ascending: false }).limit(100);
  return NextResponse.json({ items: data || [] });
}
