import { createClient } from '@supabase/supabase-js';

// 서버 전용 클라이언트 (service_role) — 절대 클라이언트로 내보내지 말 것
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.');
  return createClient(url, key, {
    auth: { persistSession: false },
    // Next.js가 라우트별 설정과 무관하게 fetch를 캐시하는 문제 차단 — DB 응답은 항상 실시간
    global: { fetch: (input: any, init?: any) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}
