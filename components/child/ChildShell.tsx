"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { AiBadge } from "./AiBadge";
import { LangSwitch } from "./LangSwitch";

/** Каркас экранов ребёнка: песок, имя, язык, плашка ИИ, центральная колонка. Без меню и заметки скелета. */
export function ChildShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <div className="min-h-dvh bg-sand text-ink">
      <header className="mx-auto flex max-w-2xl flex-col gap-2 px-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="font-display text-title font-bold">{t("app.name")}</Link>
          <LangSwitch />
        </div>
        <AiBadge />
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-10 pt-6">{children}</main>
    </div>
  );
}
