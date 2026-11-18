"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { AiBadge } from "./AiBadge";
import { BottomNav, hasBottomNav } from "./BottomNav";
import { LangSwitch } from "./LangSwitch";

/** Каркас экранов ребёнка: имя, язык, закреплённая плашка ИИ (видна при прокрутке), колонка, нижний навбар. */
export function ChildShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  const withNav = hasBottomNav(usePathname());
  return (
    <div className="min-h-dvh bg-sand text-ink">
      <header className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 pt-3">
        <Link href="/" className="font-display text-title font-bold">{t("app.name")}</Link>
        <LangSwitch />
      </header>
      <div className="sticky top-0 z-30 bg-sand">
        <div className="mx-auto max-w-2xl px-4 py-2"><AiBadge /></div>
      </div>
      <main
        className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-4"
        style={{ paddingBottom: withNav ? "calc(var(--bottom-nav-h) + 24px + env(safe-area-inset-bottom))" : "40px" }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
