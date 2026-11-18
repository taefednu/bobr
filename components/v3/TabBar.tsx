"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useT, type Key } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { IconChat, IconHome, IconHouse, IconUser } from "./icons";

export type V3Tab = "home" | "house" | "chat" | "profile";

/** `png` — глиняная иконка из public/v3 (генерация Codex, WebP рядом); `svg` — запасной контур, если PNG не вышел. */
export const V3_TABS: { id: V3Tab; href: string; label: Key; icon: React.ReactNode; png?: string }[] = [
  { id: "home", href: "/home", label: "nav.tab.home", icon: <IconHome />, png: "/v3/nav-home.webp" },
  { id: "house", href: "/house", label: "nav.tab.house", icon: <IconHouse />, png: "/v3/nav-house.webp" },
  { id: "chat", href: "/chat", label: "nav.tab.chat", icon: <IconChat />, png: "/v3/nav-chat.webp" },
  { id: "profile", href: "/profile", label: "nav.tab.profile", icon: <IconUser />, png: "/v3/nav-profile.webp" },
];

/**
 * Таб-бар v3, fixed к низу с учётом safe-area. Геометрия эталона (кадр 390): полоса 16,768,358×60,
 * четыре слота по 56 px, внутренний отступ 8, space-between: центры 52/147/243/338; активная кнопка 56×56 в своём слоте.
 * Живёт в ChildShell выше страницы и не пересоздаётся при переходе: бирюзовый круг один (layoutId) и едет между слотами пружиной
 * `move`, иконки меняют масштаб и яркость через CSS-переход. `hidden` (чат и вне вкладок) уводит бар вниз, не размонтируя.
 * Подписей нет: имя вкладки в aria-label.
 */
export function V3TabBar({ active, hidden = false }: { active: V3Tab; hidden?: boolean }) {
  const { t } = useT();
  const { transitions } = useMotion();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40"
      aria-hidden={hidden || undefined}
      style={{
        bottom: "max(var(--v3-nav-gap), env(safe-area-inset-bottom))",
        transform: hidden ? "translateY(calc(100% + 32px))" : undefined,
        opacity: hidden ? 0 : 1,
        visibility: hidden ? "hidden" : "visible",
        transition: hidden
          ? "transform var(--v3-nav-out) var(--v3-ease-out), opacity var(--v3-nav-out) var(--v3-ease-out), visibility 0s var(--v3-nav-out)"
          : "transform var(--v3-nav-out) var(--v3-ease-out), opacity var(--v3-nav-out) var(--v3-ease-out)",
      }}
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
              tabIndex={hidden ? -1 : undefined}
              aria-label={t(tab.label)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center justify-center rounded-full transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              style={{ width: "var(--v3-nav-slot)", height: "var(--v3-nav-slot)", color: on ? "var(--v3-on-teal)" : "var(--v3-ink)" }}
            >
              {on && (
                <motion.span
                  aria-hidden
                  layoutId="v3-nav-slider"
                  data-ref="navActive"
                  className="absolute inset-0 rounded-full"
                  transition={transitions.move}
                  style={{ background: "linear-gradient(160deg, var(--v3-teal-active), var(--v3-teal-strong))", boxShadow: "var(--v3-shadow-round)" }}
                />
              )}
              <span
                className="relative z-10 flex items-center justify-center"
                style={{
                  transform: on ? "scale(1.12)" : "scale(0.92)",
                  opacity: on ? 1 : 0.82,
                  transition: "transform var(--v3-nav-icon) var(--v3-ease-out), opacity var(--v3-nav-icon) var(--v3-ease-out)",
                }}
              >
                {tab.png ? (
                  // eslint-disable-next-line @next/next/no-img-element -- маленький статичный ассет
                  <img src={tab.png} alt="" width={36} height={36} draggable={false} className="block size-9 select-none" />
                ) : tab.icon}
              </span>
            </Link>
          );
        })}
      </nav>
      </div>
    </div>
  );
}
