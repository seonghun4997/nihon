import { createClient } from '@supabase/supabase-js';

// 오너 프로젝트 고정 주소 — 환경변수가 어떤 값이든 앱은 반드시 여기로 연결된다
const FALLBACK_URL = 'https://rwwcqhxxnabayycfomoa.supabase.co';

// (구형 JWT 키인 경우) 키 안의 ref로 주소 복원
export function deriveUrlFromKey(key: string | undefined): string | null {
  try {
    if (!key || key.split('.').length !== 3) return null;
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8'));
    return payload?.ref ? `https://${payload.ref}.supabase.co` : null;
  } catch { return null; }
}

export function resolveSupabaseUrl(): { url: string; source: 'env' | 'key' | 'fallback'; envRaw: string } {
  const envRaw = (process.env.SUPABASE_URL || '').trim();
  // env 값에서 순수 주소만 추출 (/rest/v1 등 경로가 붙어 있어도 자동 제거)
  try {
    const u = new URL(envRaw);
    if (u.hostname.endsWith('.supabase.co') || u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return { url: u.origin, source: 'env', envRaw };
    }
  } catch { /* 빈 값·형식 오류 → 아래로 */ }
  const derived = deriveUrlFromKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (derived) return { url: derived, source: 'key', envRaw };
  return { url: FALLBACK_URL, source: 'fallback', envRaw };
}

// 서버 전용 클라이언트 (service_role) — 절대 클라이언트로 내보내지 말 것
export function db() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.');
  return createClient(resolveSupabaseUrl().url, key, {
    auth: { persistSession: false },
    // Next.js fetch 캐시 차단 — DB 응답은 항상 실시간
    global: { fetch: (input: any, init?: any) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}
