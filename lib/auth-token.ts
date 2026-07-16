// Web Crypto 기반 — edge(middleware)와 node(API) 양쪽에서 동작
export const AUTH_COOKIE = 'jp_auth';

export async function authToken(): Promise<string> {
  const code = process.env.ACCESS_CODE || '';
  const data = new TextEncoder().encode('nihon-v1::' + code);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
