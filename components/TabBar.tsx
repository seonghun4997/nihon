'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 표준: 대분류는 최대 5개 — 모바일 하단탭 = 데스크톱 왼쪽바
const TABS = [
  { href: '/s', ic: '🏠', label: '오늘' },
  { href: '/s/notes', ic: '📝', label: '노트' },
  { href: '/s/cards', ic: '🃏', label: '단어' },
  { href: '/s/talk', ic: '💬', label: '회화' },
  { href: '/s/media', ic: '🎬', label: '미디어' },
];

export default function TabBar(_props: { role?: string }) {
  const path = usePathname();
  return (
    <nav className="tabbar">
      <div className="side-brand"><span className="gem" /> <b>NIHON</b></div>
      {TABS.map((t) => {
        const on = t.href === '/s' ? path === '/s' : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={on ? 'on' : ''}>
            <span className="ic">{t.ic}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
