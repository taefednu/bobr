"use client";
// Пузыри переписки: ink-контур, хвост-скругление к говорящему. Текст только как текст (React экранирует).
import { useState } from "react";
import { motion } from "framer-motion";
import { THINKING, useMotion } from "@/lib/motion";
import { FRESH_MS, type ChatMsg, type Partner } from "./model";
import { Portrait } from "./Portrait";

const FILL: Record<ChatMsg["role"], string> = {
  child: "bg-lazuli text-paper",
  bobr: "bg-[var(--color-bubble-bobr)] text-ink",
  ustoz: "bg-[var(--color-bubble-ustoz)] text-ink",
};

type RowProps = { role: ChatMsg["role"]; text: string; label: string; fresh?: boolean; delay?: number };

/** Одна реплика. Свежая въезжает снизу (appear); история и переключение собеседника стоят на месте. */
export function Bubble({ role, text, label, fresh = false, delay = 0 }: RowProps) {
  const { reduced, transitions } = useMotion();
  const mine = role === "child";
  return (
    <motion.li
      className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
      initial={fresh && !reduced ? { opacity: 0, y: 14, scale: 0.94 } : false}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { ...transitions.appear, delay } }}
      style={{ transformOrigin: mine ? "100% 100%" : "0% 100%" }}
    >
      {!mine && <Portrait who={role as Partner} size={36} />}
      <p
        className={`max-w-[82%] whitespace-pre-wrap break-words rounded-lg px-4 py-2.5 text-body shadow-rest md:max-w-[70%] ${FILL[role]} ${
          mine ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
      >
        <span className="sr-only">{label}: </span>
        {text}
      </p>
    </motion.li>
  );
}

/** Сообщение из истории: свежим считается пришедшее только что (сервер ставит ts). */
export function MessageRow({ m, label }: { m: ChatMsg; label: string }) {
  const [fresh] = useState(() => Date.now() - m.ts < FRESH_MS);
  return <Bubble role={m.role} text={m.text} label={label} fresh={fresh} />;
}

/** Ждём ответ: три точки в пузыре собеседника, зажигаются по очереди (THINKING). */
export function TypingBubble({ who, label }: { who: Partner; label: string }) {
  const { reduced, transitions } = useMotion();
  return (
    <motion.li
      role="status"
      className="flex items-end gap-2"
      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: transitions.appear }}
      style={{ transformOrigin: "0% 100%" }}
    >
      <Portrait who={who} size={36} />
      <span
        className={`flex items-center gap-1.5 rounded-lg rounded-bl-sm px-4 py-4 shadow-rest ${FILL[who]}`}
        style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
      >
        <span className="sr-only">{label}</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="block size-2.5 rounded-full bg-ink"
            animate={reduced ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: THINKING.dotPeriodS, repeat: Infinity, delay: i * THINKING.dotStepS, ease: "easeInOut" }}
          />
        ))}
      </span>
    </motion.li>
  );
}
