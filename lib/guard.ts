import { cookies } from 'next/headers';

// API 경로 문지기 — 쿠키의 접속 코드가 맞아야 통과
export function isAuthed(): boolean {
  const token = cookies().get('jp_auth')?.value;
  return !!process.env.ACCESS_CODE && token === process.env.ACCESS_CODE;
}
