import { createClient } from '@supabase/supabase-js';

// SERVICE_ROLE_KEY(JWT) 안에는 프로젝트 ref가 들어있다 → 올바른 주소를 스스로 복원
export function deriveUrlFromKey(key: string | undefined): string | null {
  try {
    if (!key || key.split('.').length !== 3) return null;
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8'));
    return payload?.ref ? `https://${payload.ref}.supabase.co` : null;
  } catch { return null; }
}

export function resolveSupabaseUrl(): { url: string | null; source: 'env' | 'key' | 'none'; envRaw: string } {
  const envRaw = (process.env.SUPABASE_URL || '').trim();
  const validEnv = /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*(:\d+)?\/?$/.test(envRaw) &&
    (envRaw.includes('.supabase.co') || envRaw.includes('localhost')) &&
    !envRaw.includes('supabase.com') && !/supabase\.co\/./.test(envRaw.replace(/\/$/, '') + '/x'.slice(0, 0));
  const cleanEnv = envRaw.replace(/\/+$/, '');
  // env 값이 순수한 프로젝트 주소면 그대로, 아니면 키에서 복원
  const envOK = validEnv && /^https?:\/\/[a-z0-9-]+\.(supabase\.co|localhost)$|localhost/.test(cleanEnv);
  if (envOK) return { url: cleanEnv, source: 'env', envRaw };
  const derived = deriveUrlFromKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (derived) return { url: derived, source: 'key', envRaw };
  return { url: cleanEnv || null, source: envRaw ? 'env' : 'none', envRaw };
}

// 서버 전용 클라이언트 (service_role) — 절대 클라이언트로 내보내지 말 것
export function db() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { url } = resolveSupabaseUrl();
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.');
  return createClient(url, key, {
    auth: { persistSession: false },
    // Next.js fetch 캐시 차단 — DB 응답은 항상 실시간
    global: { fetch: (input: any, init?: any) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}
