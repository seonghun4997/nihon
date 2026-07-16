'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STUDENT = [
  { href: '/s', ic: '🏠', label: '오늘' },
  { href: '/s/notes', ic: '📝', label: '노트' },
  { href: '/s/cards', ic: '🃏', label: '단어' },
  { href: '/s/questions', ic: '❓', label: '질문' },
  { href: '/s/plan', ic: '📅', label: '일정·정산' },
];
const TEACHER = [
  { href: '/t', ic: '🏠', label: '오늘' },
  { href: '/t/students', ic: '👥', label: '학생' },
  { href: '/t/money', ic: '💰', label: '정산' },
];

export default function TabBar({ role }: { role: 'student' | 'teacher' }) {
  const path = usePathname();
  const tabs = role === 'teacher' ? TEACHER : STUDENT;
  const root = role === 'teacher' ? '/t' : '/s';
  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const on = t.href === root ? path === root : path.startsWith(t.href);
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
