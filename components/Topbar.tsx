'use client';
import { useRouter } from 'next/navigation';

export default function Topbar({ name, badge, lang }: { name?: string; badge?: string; lang?: 'jp' | 'en' }) {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  async function switchLang(l: 'jp' | 'en') {
    await fetch('/api/s/lang', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lang: l }) });
    router.refresh();
  }
  return (
    <header className="topbar">
      <div className="gem" /> <b>NIHON</b>
      <div className="right">
        {lang && (
          <span className="lang-toggle">
            <button className={lang === 'jp' ? 'on' : ''} onClick={() => switchLang('jp')}>🇯🇵 일본어</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => switchLang('en')}>🇬🇧 영어</button>
          </span>
        )}
        {badge && !lang && <span className="role-badge">{badge}</span>}
        <button className="linkbtn" onClick={logout}>로그아웃</button>
      </div>
    </header>
  );
}
