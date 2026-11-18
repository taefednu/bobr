"use client";
// Левая рейка от lg: заменяет нижний таб-бар теми же NAV_ITEMS. Активный пункт стоит на ink-уступе, как клавиша.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { Logo } from "./Logo";
import { NAV_ITEMS, NavIcon, hasBottomNav } from "./BottomNav";

export function SideRail() {
  const { t } = useT();
  const path = usePathname();
  if (!hasBottomNav(path)) return null;
  return (
    <aside
      className="sticky top-0 hidden h-dvh w-[var(--rail-w)] shrink-0 flex-col gap-8 bg-paper px-4 py-6 lg:flex"
      style={{ borderRight: "var(--stroke-ink) solid var(--color-ink)" }}
    >
      <div className="flex items-center gap-3">
        <Logo size={48} />
        <span className="font-display text-title font-bold">{t("app.name")}</span>
      </div>
      <nav aria-label={t("nav.home")}>
        <ul className="flex flex-col gap-3">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = path.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 items-center gap-3 rounded-xl px-4 text-button font-semibold transition-[transform,background-color] duration-100 motion-reduce:transition-none ${
                    active
                      ? "translate-y-0 bg-lazuli text-paper active:translate-y-0.5"
                      : "text-ink hover:bg-clay-100 active:bg-clay-100"
                  }`}
                  style={
                    active
                      ? { border: "var(--stroke-ink) solid var(--color-ink)", boxShadow: "0 4px 0 var(--color-ink), var(--shadow-clay-primary)" }
                      : { border: "var(--stroke-ink) solid transparent" }
                  }
                >
                  <NavIcon icon={icon} active={active} />
                  <span className="min-w-0 truncate">{t(label)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
