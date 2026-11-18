"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { AiBadge } from "./AiBadge";
import { BottomNav, hasBottomNav } from "./BottomNav";
import { LangSwitch } from "./LangSwitch";
import { SideRail } from "./SideRail";

/** Куда ведёт «назад» на экранах без навигации (урок, «Научи Bobr», цель). У остальных кнопки нет. */
const BACK: [string, string][] = [["/lesson", "/mahalla"], ["/teach", "/lesson"], ["/goal", "/start"]];

/**
 * Каркас экранов ребёнка как у приложения: верхняя полоса (назад, плашка ИИ, язык) в один ряд,
 * дальше содержимое с большим заголовком, внизу таб-бар (до lg) или слева рейка (от lg).
 * Высоту полосы пишем в --top-bar-h: от неё считают чат и липкие панели.
 */
export function ChildShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  const path = usePathname();
  const withNav = hasBottomNav(path);
  const back = BACK.find(([p]) => path.startsWith(p))?.[1];
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const write = () => document.documentElement.style.setProperty("--top-bar-h", `${el.offsetHeight}px`);
    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex min-h-dvh text-ink">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          ref={bar}
          className="sticky top-0 z-30 pt-[env(safe-area-inset-top)] [background:var(--bg-stage)]"
          style={{ borderBottom: "var(--stroke-ink-thin) solid color-mix(in oklch, var(--color-ink) 14%, transparent)" }}
        >
          <div className="mx-auto flex min-h-14 w-full max-w-2xl items-center gap-2 px-4 py-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] lg:max-w-6xl lg:gap-4 lg:px-8">
            {back && (
              <Link
                href={back}
                aria-label={t("child.back")}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-paper active:translate-y-px"
                style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 10 H4 M9 4.5 L3.5 10 L9 15.5" />
                </svg>
              </Link>
            )}
            <div className="min-w-0 flex-1"><AiBadge /></div>
            <LangSwitch />
          </div>
        </header>
        <main
          className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-5 lg:max-w-6xl lg:px-8 lg:pt-8"
          style={{ paddingBottom: withNav ? "calc(var(--bottom-nav-h) + 24px + env(safe-area-inset-bottom))" : "calc(40px + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
