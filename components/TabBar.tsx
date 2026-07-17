"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_VERSION } from "@/lib/version";

// 오너 지정 대분류: 홈 · 복습 · 수업 · 예습 · 미디어 · 저장
const TABS = [
  { href: "/s", ic: "🏠", label: "홈" },
  { href: "/s/cards", ic: "🔁", label: "복습" },
  { href: "/s/notes", ic: "📝", label: "수업" },
  { href: "/s/prep", ic: "💡", label: "예습" },
  { href: "/s/media", ic: "🎬", label: "미디어" },
  { href: "/s/vault", ic: "📦", label: "저장" },
];

export default function TabBar(_props: { role?: string }) {
  const path = usePathname();
  return (
    <nav className="tabbar">
      <div className="side-brand"><span className="gem" /> <b>NIHON</b></div>
      {TABS.map((t) => {
        const on = t.href === "/s" ? path === "/s" : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={on ? "on" : ""}>
            <span className="ic">{t.ic}</span>
            {t.label}
          </Link>
        );
      })}
      <div className="side-ver">{APP_VERSION}</div>
    </nav>
  );
}
