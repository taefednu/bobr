"use client";
import { setLang, useT, type Lang } from "@/lib/i18n";

const LANGS: Lang[] = ["uz", "ru"];

/** Сегмент UZ/RU: выбранный язык залит ink, второй тихий. Цель касания 44 px, тонкий ink-контур, без выступа. */
export function LangSwitch() {
  const { t, lang } = useT();
  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className="inline-flex h-11 shrink-0 overflow-hidden rounded-full bg-paper"
      style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          aria-label={t(`lang.${l}`)}
          onClick={() => setLang(l)}
          className={`h-full min-w-11 cursor-pointer px-3 text-label ${lang === l ? "bg-ink text-paper" : "text-ink-muted"}`}
        >
          {t(`lang.short.${l}`)}
        </button>
      ))}
    </div>
  );
}
