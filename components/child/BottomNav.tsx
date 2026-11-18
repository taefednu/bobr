"use client";
// Нижний навбар ребёнка. В уроке его нет (DESIGN.md §5), в цели и диагностике тоже: там один путь вперёд.
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useT, type Key } from "@/lib/i18n";

const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ITEMS: { href: string; label: Key; icon: ReactNode }[] = [
  {
    href: "/mahalla",
    label: "nav.mahalla",
    icon: <path d="M3 9h18M5 9v11h14V9M4 5h16v4H4zM10 20v-6h4v6" {...LINE} />,
  },
  {
    href: "/plan",
    label: "nav.plan",
    icon: <path d="M6 20a3 3 0 0 1 0-6h12a3 3 0 0 0 0-6H9M9 5v6" {...LINE} />,
  },
  {
    href: "/chat",
    label: "nav.chat",
    icon: <path d="M4 5h16v11H10l-5 4v-4H4z" {...LINE} />,
  },
];

export const hasBottomNav = (path: string) => ITEMS.some((i) => path.startsWith(i.href));

export function BottomNav() {
  const { t } = useT();
  const path = usePathname();
  if (!hasBottomNav(path)) return null;
  return (
    <nav
      aria-label={t("nav.home")}
      className="fixed inset-x-0 bottom-0 z-40 bg-paper pb-[env(safe-area-inset-bottom)]"
      style={{ borderTop: "var(--stroke-ink) solid var(--color-ink)" }}
    >
      <ul className="mx-auto flex h-[var(--bottom-nav-h)] max-w-2xl items-center gap-2 px-4">
        {ITEMS.map(({ href, label, icon }) => {
          const active = path.startsWith(href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md text-center text-label leading-tight ${
                  active ? "bg-clay-100 text-ink" : "text-ink-muted"
                }`}
                style={{ border: `var(--stroke-ink-thin) solid ${active ? "var(--color-ink)" : "transparent"}` }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>{icon}</svg>
                <span className="max-w-full truncate px-1">{t(label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
