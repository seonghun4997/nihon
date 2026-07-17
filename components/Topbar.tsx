'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_VERSION } from '@/lib/version';

// 상단바: 대분류 5개에 못 들어간 나머지 전부 (질문·설정·언어·로그아웃)
export default function Topbar({ lang }: { name?: string; badge?: string; lang?: 'jp' | 'en' }) {
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
      <span className="brand-m"><span className="gem" /> <b>NIHON</b></span>
      <div className="right">
        {lang && (
          <span className="lang-toggle">
            <button className={lang === 'jp' ? 'on' : ''} onClick={() => switchLang('jp')}>🇯🇵</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => switchLang('en')}>🇬🇧</button>
          </span>
        )}
        <Link href="/s/questions" className="topicon" title="질문 박스">❓</Link>
        <Link href="/s/plan" className="topicon" title="설정">⚙️</Link>
        <button className="linkbtn" onClick={logout}>나가기</button>
        <span className="ver">{APP_VERSION}</span>
      </div>
    </header>
  );
}
