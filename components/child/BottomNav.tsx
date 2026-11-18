"use client";
// Навигация ребёнка: три вкладки. До lg это нижний таб-бар (здесь), от lg её заменяет SideRail с теми же ITEMS.
// В уроке, «Научи Bobr», цели и диагностике навигации нет (DESIGN.md §5): там один путь вперёд.
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useT, type Key } from "@/lib/i18n";

/** Заливка по состоянию: у активной вкладки иконка «наливается» apricot, у остальных контур. */
const G = (active: boolean) =>
  ({ fill: active ? "var(--color-apricot)" : "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round", strokeLinejoin: "round" }) as const;

export const NAV_ITEMS: { href: string; label: Key; icon: (active: boolean) => ReactNode }[] = [
  {
    href: "/home",
    label: "nav.tab.home",
    // дом с плоской крышей и дверью
    icon: (a) => (
      <>
        <path d="M3.5 9.5h17V20h-17z" {...G(a)} />
        <path d="M2.5 9.5 4.5 5h15l2 4.5" {...G(false)} />
        <path d="M10 20v-5.5a2 2 0 0 1 4 0V20" {...G(false)} />
      </>
    ),
  },
  {
    href: "/plan",
    label: "nav.plan",
    // извилистая тропа к флажку
    icon: (a) => (
      <>
        <path d="M6 21a3 3 0 0 1 0-6h10a3 3 0 0 0 0-6H9" {...G(false)} />
        <path d="M9 3.5v7l6-3.5z" {...G(a)} />
      </>
    ),
  },
  {
    href: "/chat",
    label: "nav.chat",
    // пузырь реплики с хвостиком
    icon: (a) => <path d="M4 4.5h16v11.5h-9l-5 4v-4H4z" {...G(a)} />,
  },
];

export const hasBottomNav = (path: string) => NAV_ITEMS.some((i) => path.startsWith(i.href));

export function NavIcon({ icon, active }: { icon: (a: boolean) => ReactNode; active: boolean }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden className="shrink-0">{icon(active)}</svg>;
}

export function BottomNav() {
  const { t } = useT();
  const path = usePathname();
  if (!hasBottomNav(path)) return null;
  return (
    <nav
      aria-label={t("nav.home")}
      className="fixed inset-x-0 bottom-0 z-40 bg-paper pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-nav)] lg:hidden"
      style={{ borderTop: "var(--stroke-ink) solid var(--color-ink)" }}
    >
      <ul className="mx-auto flex h-[var(--bottom-nav-h)] max-w-2xl items-stretch gap-1 px-2 py-1.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = path.startsWith(href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex h-full min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-center text-label leading-none"
              >
                {/* Иконка в «таблетке»: активная заливается lazuli и стоит на ink-уступе, при нажатии садится на него. */}
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-[transform,box-shadow] duration-100 motion-reduce:transition-none ${
                    active
                      ? "bg-lazuli text-paper group-active:translate-y-0.5"
                      : "text-ink-muted group-active:scale-90 motion-reduce:group-active:scale-100"
                  }`}
                  style={
                    active
                      ? { border: "var(--stroke-ink-thin) solid var(--color-ink)", boxShadow: "0 2px 0 var(--color-ink)" }
                      : undefined
                  }
                >
                  <NavIcon icon={icon} active={active} />
                </span>
                <span className={`max-w-full truncate px-1 ${active ? "font-bold text-ink" : "text-ink-muted"}`}>{t(label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
