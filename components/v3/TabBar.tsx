"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useT, type Key } from "@/lib/i18n";
import { IconChat, IconHome, IconHouse, IconUser } from "./icons";

export type V3Tab = "home" | "house" | "chat" | "profile";

export const V3_TABS: { id: V3Tab; href: string; label: Key; icon: ReactNode }[] = [
  { id: "home", href: "/home", label: "nav.tab.home", icon: <IconHome /> },
  { id: "house", href: "/house", label: "nav.tab.house", icon: <IconHouse /> },
  { id: "chat", href: "/chat", label: "nav.tab.chat", icon: <IconChat /> },
  { id: "profile", href: "/profile", label: "nav.tab.profile", icon: <IconUser /> },
];

/**
 * Таб-бар v3, fixed к низу с учётом safe-area. Геометрия эталона (кадр 390): полоса 16,768,358×60,
 * четыре слота по 56 px, внутренний отступ 8, space-between: центры 52/147/243/338; активная кнопка 56×56 в своём слоте.
 * Подписей нет: имя вкладки в aria-label.
 */
export function V3TabBar({ active }: { active: V3Tab }) {
  const { t } = useT();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40"
      style={{ bottom: "max(var(--v3-nav-gap), env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-[var(--v3-col-max)] px-[var(--v3-gutter)]">
      <nav
        aria-label={t("nav.label")}
        data-ref="nav"
        className="pointer-events-auto flex items-center justify-between"
        style={{
          height: "var(--v3-nav-h)",
          padding: "0 var(--v3-nav-pad)",
          borderRadius: "var(--v3-r-nav)",
          background: "var(--v3-nav)",
          boxShadow: "var(--v3-shadow-nav)",
        }}
      >
        {V3_TABS.map((tab) => {
          const on = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-label={t(tab.label)}
              aria-current={on ? "page" : undefined}
              data-ref={on ? "navActive" : undefined}
              className="flex shrink-0 items-center justify-center rounded-full transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              style={{
                width: "var(--v3-nav-slot)",
                height: "var(--v3-nav-slot)",
                color: on ? "var(--v3-on-teal)" : "var(--v3-ink)",
                background: on ? "linear-gradient(160deg, var(--v3-teal-active), var(--v3-teal-strong))" : undefined,
                boxShadow: on ? "var(--v3-shadow-round)" : undefined,
              }}
            >
              {tab.icon}
            </Link>
          );
        })}
      </nav>
      </div>
    </div>
  );
}
