"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useT, type Key, type Lang } from "@/lib/i18n";
import { useSetLang } from "@/lib/ui/useSetLang";

const NAV: [string, Key][] = [
  ["/goal", "nav.goal"],
  ["/diagnose", "nav.diagnose"],
  ["/home", "nav.tab.home"],
  ["/lesson", "nav.lesson"],
  ["/teach", "nav.teach"],
  ["/chat", "nav.chat"],
  ["/parent", "nav.parent"],
];

/** Плашка ИИ: всегда видна, без анимации, не мельче подписи (text-sm). */
export function AiBadge() {
  const { t } = useT();
  return (
    <p role="note" className="border border-ink-muted bg-paper px-3 py-1 text-sm text-ink">
      {t("ai.badge")}
    </p>
  );
}

function LangSwitch() {
  const { t, lang } = useT();
  const setLangBoth = useSetLang();
  return (
    <div role="group" aria-label={t("lang.label")} className="flex gap-1 text-sm">
      {(["uz", "ru"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => void setLangBoth(l)}
          className={`border border-ink-muted px-3 py-1 ${lang === l ? "bg-clay-100 text-ink" : "bg-paper text-ink-muted"}`}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}

export function Character({ who, state = "idle" }: { who: "bobr" | "ustoz"; state?: "idle" | "talking" }) {
  const { t } = useT();
  return (
    <div className="inline-block border border-ink-muted bg-clay-100 px-4 py-6 text-sm text-ink">
      {t(`char.${who}`)}: {t(`char.${state}`)}
    </div>
  );
}

export function Shell({ badge, children }: { badge?: boolean; children: ReactNode }) {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-sand text-ink">
      <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-ink-muted bg-sand p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/" className="text-base font-bold">{t("app.name")}</Link>
          <LangSwitch />
        </div>
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {NAV.map(([href, k]) => (
            <Link key={href} href={href} className="underline">{t(k)}</Link>
          ))}
        </nav>
        {badge && <AiBadge />}
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">{children}</main>
      <p className="p-4 text-sm text-ink-muted">{t("skeleton.note")}</p>
    </div>
  );
}
