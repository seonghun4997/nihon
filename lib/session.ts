import { cookies } from 'next/headers';

// ── 오너 전용 모드: 접속 코드 1개 = 세션 ──
// v3의 getSession() 시그니처를 유지해 하위 API 코드 무수정 재사용
export const OWNER_ID = '00000000-0000-0000-0000-000000000001';

export type Session = { id: string; role: 'owner' | 'teacher' | 'student' };

export function getSession(): Session | null {
  const raw = cookies().get('sid')?.value;
  if (!raw || !process.env.ACCESS_CODE || raw !== process.env.ACCESS_CODE) return null;
  return { id: OWNER_ID, role: 'student' };
}

export const SESSION_COOKIE = {
  name: 'sid',
  options: { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 365 },
};
