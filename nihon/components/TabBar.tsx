'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/jp', ic: '🏠', label: '오늘' },
  { href: '/jp/notes', ic: '📝', label: '수업 노트' },
  { href: '/jp/cards', ic: '🃏', label: '단어·가나' },
  { href: '/jp/questions', ic: '❓', label: '질문 박스' },
  { href: '/jp/talk', ic: '💬', label: '회화' },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const on = t.href === '/jp' ? path === '/jp' : path.startsWith(t.href);
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
