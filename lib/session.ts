import { cookies } from 'next/headers';
import { createHmac, scryptSync, randomBytes, timingSafeEqual } from 'crypto';

// ── 세션: 서명 쿠키 (sid = base64(id:role).서명) ──
const SECRET = () => 'nihon-session::' + (process.env.ACCESS_CODE || 'dev');

export type Session = { id: string; role: 'owner' | 'teacher' | 'student' };

export function signSession(s: Session): string {
  const payload = Buffer.from(`${s.id}:${s.role}`).toString('base64url');
  const sig = createHmac('sha256', SECRET()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function getSession(): Session | null {
  const raw = cookies().get('sid')?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const expect = createHmac('sha256', SECRET()).update(payload).digest('base64url');
  if (sig !== expect) return null;
  const [id, role] = Buffer.from(payload, 'base64url').toString().split(':');
  if (!id || !['owner', 'teacher', 'student'].includes(role)) return null;
  return { id, role: role as Session['role'] };
}

// ── 비밀번호: scrypt ──
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pw, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const test = scryptSync(pw, salt, 32);
  const ref = Buffer.from(hash, 'hex');
  return test.length === ref.length && timingSafeEqual(test, ref);
}

export const SESSION_COOKIE = {
  name: 'sid',
  options: { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 365 },
};
