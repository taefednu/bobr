"use client";
// Поле ввода: Enter отправляет, Shift+Enter новая строка, 500 знаков, кнопка серая при пустом и пока ждём ответ.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";
import { COUNT_FROM, MAX_LEN } from "./model";

export function Composer({ pending, onSend }: { pending: boolean; onSend: (text: string) => void }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const canSend = text.trim().length > 0 && !pending;

  // поле растёт до четырёх строк (высота textarea, не макет страницы)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    box.current?.focus(); // на телефоне клавиатура остаётся
  }
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      className="flex items-end gap-3 bg-paper px-3 pb-3 pt-3"
      style={{ borderTop: "var(--stroke-ink) solid var(--color-ink)" }}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="relative min-w-0 flex-1">
        <textarea
          ref={box}
          rows={1}
          value={text}
          maxLength={MAX_LEN}
          aria-label={t("chat.placeholder")}
          placeholder={t("chat.placeholder")}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          className="block max-h-32 min-h-[52px] w-full resize-none rounded-md bg-sand px-4 py-[11px] text-body text-ink shadow-well placeholder:text-ink-muted"
          style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
        />
        {text.length >= COUNT_FROM && (
          <span className="absolute -top-6 right-1 text-label text-ink-muted tabular">
            {t("chat.count").replace("{n}", String(text.length)).replace("{max}", String(MAX_LEN))}
          </span>
        )}
      </div>
      <PressButton type="submit" disabled={!canSend}>
        <span className="flex items-center gap-2">
          <span className="sr-only sm:not-sr-only">{t("chat.send")}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h15M13 5l7 7-7 7" />
          </svg>
        </span>
      </PressButton>
    </form>
  );
}
