"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { CrisisOverlay } from "@/components/teach/CrisisOverlay";
import { useT } from "@/lib/i18n";
import { crisisMessage } from "@/lib/safety/crisis";
import { useChildSession } from "@/lib/ui/session";
import { useLangSync } from "@/lib/ui/useSetLang";
import { AiBadge } from "./AiBadge";
import { BottomNav, hasBottomNav } from "./BottomNav";
import { LangSwitch } from "./LangSwitch";
import { SideRail } from "./SideRail";
import { isV3Route, tabIndex, TAB_PATHS, hasTabBar } from "@/components/v3/routes";
import { V3ChromeContext } from "@/components/v3/Screen";
import { V3TabBar, V3_TABS } from "@/components/v3/TabBar";

/** Куда ведёт «назад» на экранах без навигации (урок, «Научи Bobr», цель). У остальных кнопки нет. */
const BACK: [string, string][] = [["/lesson", "/home"], ["/teach", "/lesson"], ["/goal", "/start"]];

/** Экраны со своим оверлеем кризиса (по view.crisis с сервера): общий там был бы вторым. */
const OWN_CRISIS = ["/lesson", "/teach"];

/** Единый источник правды о кризисе: me.state === "CRISIS" на любом экране v3, кроме тех, что рисуют его сами.
 *  Чат, «назад» и перезагрузка не прячут экран с доверенным взрослым, пока ребёнок его не закрыл. */
function CrisisGate() {
  const { t, lang } = useT();
  const router = useRouter();
  const path = usePathname();
  const { token, me } = useChildSession();
  const leaveCrisis = useMutation(api.conductor.leaveCrisis);
  if (me?.state !== "CRISIS" || OWN_CRISIS.some((p) => path.startsWith(p))) return null;
  const m = crisisMessage(lang);
  const leave = async () => {
    if (token) await leaveCrisis({ token }).catch(() => {});
    router.push("/home");
  };
  return <CrisisOverlay crisis={{ text: m.trustedAdultFirst, numbers: [...m.numbers] }} onLeave={leave} backLabel={t("chat.crisis.back")} />;
}

/** Фон и таб-бар вкладок живут здесь, выше страницы: при переходе между /home, /house, /chat, /profile они не пересоздаются
 *  и не двигаются, а двигается только содержимое (app/(child)/template.tsx). Вне вкладок (урок, цель) бара нет, у экрана свой фон. */
function V3Chrome({ path, children }: { path: string; children: ReactNode }) {
  const idx = tabIndex(path);
  const [last, setLast] = useState(0); // на экране вне вкладок бар скрыт, ползунок стоит где стоял
  if (idx >= 0 && idx !== last) setLast(idx);
  const tab = V3_TABS.find((x) => x.href === TAB_PATHS[idx >= 0 ? idx : last])!.id;
  return (
    <V3ChromeContext.Provider value={idx >= 0}>
      {idx >= 0 && <div aria-hidden className="fixed inset-0" style={{ background: "var(--v3-bg)" }} />}
      {children}
      <V3TabBar active={tab} hidden={!hasTabBar(path)} />
    </V3ChromeContext.Provider>
  );
}

/**
 * Каркас экранов ребёнка как у приложения: верхняя полоса (назад, плашка ИИ, язык) в один ряд,
 * дальше содержимое с большим заголовком, внизу таб-бар (до lg) или слева рейка (от lg).
 * Высоту полосы пишем в --top-bar-h: от неё считают чат и липкие панели.
 */
export function ChildShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  useLangSync();
  const path = usePathname();
  const v3 = isV3Route(path);
  const withNav = hasBottomNav(path);
  const back = BACK.find(([p]) => path.startsWith(p))?.[1];
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (v3) {
      // v3: шапки и старого таб-бара нет, чат считает высоту от нулей
      root.style.setProperty("--top-bar-h", "0px");
      root.style.setProperty("--bottom-nav-h", "0px");
      return () => root.style.removeProperty("--bottom-nav-h");
    }
    const el = bar.current;
    if (!el) return;
    const write = () => document.documentElement.style.setProperty("--top-bar-h", `${el.offsetHeight}px`);
    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    return () => ro.disconnect();
  }, [v3]);

  if (v3) return <V3Chrome path={path}><div className="min-h-dvh overflow-x-clip text-ink">{children}<CrisisGate /></div></V3Chrome>;

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
