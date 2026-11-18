"use client";
// Поле ввода v3: пилюля 358×56 с круглой кнопкой справа. Enter отправляет, Shift+Enter новая строка, 500 знаков.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { COUNT_FROM, MAX_LEN } from "@/components/chat/model";
import { V3RoundButton, IconSend } from "@/components/v3";
import { useT } from "@/lib/i18n";

export function V3Composer({ placeholder, pending, onSend, defaultText = "" }: { placeholder: string; pending: boolean; onSend: (text: string) => void; defaultText?: string }) {
  const { t } = useT();
  const [text, setText] = useState(defaultText);
  const box = useRef<HTMLTextAreaElement>(null);
  const canSend = text.trim().length > 0 && !pending;

  // поле растёт до четырёх строк (высота textarea, не макет страницы)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 118)}px`;
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
      data-ref="input"
      className="relative flex min-h-14 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[color:var(--v3-teal-strong)] items-end gap-2 py-[5px] pl-[18px] pr-1.5"
      style={{ borderRadius: 28, background: "var(--v3-field)", boxShadow: "var(--v3-shadow-card)" }}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <textarea
        ref={box}
        rows={1}
        value={text}
        maxLength={MAX_LEN}
        aria-label={t("chatv3.input.aria")}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        className="v3-type-chat block min-h-[46px] min-w-0 flex-1 resize-none bg-transparent py-[11px] outline-none placeholder:text-[color:var(--v3-ink-soft)] placeholder:opacity-80"
        style={{ color: "var(--v3-ink)", outline: "none" }} // кольцо фокуса рисует форма (focus-within), иначе у textarea квадратная рамка
      />
      <V3RoundButton data-ref="send" type="submit" label={t("chatv3.send")} size={46} disabled={pending}><IconSend size={22} /></V3RoundButton>
      {text.length >= COUNT_FROM && (
        <span className="v3-type-caption absolute -top-6 right-2 tabular-nums" style={{ color: "var(--v3-ink-soft)" }}>
          {t("chat.count").replace("{n}", String(text.length)).replace("{max}", String(MAX_LEN))}
        </span>
      )}
    </form>
  );
}
