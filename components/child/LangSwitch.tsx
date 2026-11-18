"use client";
import { setLang, useT, type Lang } from "@/lib/i18n";

const LANGS: Lang[] = ["uz", "ru"];

/** Чипы выбора языка: тонкий ink-контур, без выступа (это не главная кнопка), цель касания 44 px. */
export function LangSwitch() {
  const { t, lang } = useT();
  return (
    <div role="group" aria-label={t("lang.label")} className="flex gap-2">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`min-h-11 min-w-11 cursor-pointer rounded-full px-4 text-label ${lang === l ? "bg-clay-100 text-ink" : "bg-paper text-ink-muted"}`}
          style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}
