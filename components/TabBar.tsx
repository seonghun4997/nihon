'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/s', ic: '🏠', label: '오늘' },
  { href: '/s/notes', ic: '📝', label: '노트' },
  { href: '/s/cards', ic: '🃏', label: '단어' },
  { href: '/s/questions', ic: '❓', label: '질문' },
  { href: '/s/plan', ic: '⚙️', label: '설정' },
];

export default function TabBar(_props: { role?: string }) {
  const path = usePathname();
  return (
    <nav className="tabbar">
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
