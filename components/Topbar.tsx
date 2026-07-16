'use client';
import { useRouter } from 'next/navigation';

export default function Topbar({ name, badge }: { name?: string; badge?: string }) {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  return (
    <header className="topbar">
      <div className="gem" /> <b>NIHON</b>
      <div className="right">
        {badge && <span className="role-badge">{badge}</span>}
        {name && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{name}</span>}
        <button className="linkbtn" onClick={logout}>로그아웃</button>
      </div>
    </header>
  );
}
