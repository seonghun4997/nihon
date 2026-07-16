import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = db();
  const { data } = await s.from('jp_questions').select('*').order('created_at', { ascending: false }).limit(100);
  return NextResponse.json({ items: data || [] });
}
