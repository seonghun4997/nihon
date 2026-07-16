import { createClient } from '@supabase/supabase-js';

// 서버 전용 클라이언트 (service_role) — 절대 클라이언트로 내보내지 말 것
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.');
  return createClient(url, key, { auth: { persistSession: false } });
}
