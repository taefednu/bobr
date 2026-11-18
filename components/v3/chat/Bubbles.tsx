"use client";
// Пузыри v3: у собеседника аватар слева и тёплая карточка, у ребёнка бирюзовая плашка справа. Текст только как текст.
import { useState } from "react";
import { motion } from "framer-motion";
import { FRESH_MS, type ChatMsg, type Partner } from "@/components/chat/model";
import { useT } from "@/lib/i18n";
import { THINKING, useMotion } from "@/lib/motion";
import { V3Pie } from "./Pie";

// служебные маски preGuard/guard: ребёнку они не показываются
const MASK = /\[(?:PII|NAME|PHONE|ADDRESS|SCHOOL|EMAIL|URL|HANDLE)\]/g;
const BUBBLE = "v3-type-chat whitespace-pre-wrap break-words px-5 py-3";
const RADIUS = { borderRadius: "var(--v3-r-bubble)" } as const;
const THEIRS = { ...RADIUS, background: "var(--v3-card-ustoz)", boxShadow: "var(--v3-shadow-card)" } as const;
const MINE = { ...RADIUS, background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" } as const;

export function Avatar({ who, size, dataRef }: { who: Partner; size: number; dataRef?: string }) {
  return (
    <img data-ref={dataRef} src={`/v3/avatar-${who}.png`} alt="" aria-hidden width={size} height={size} draggable={false}
      className="block shrink-0 select-none rounded-full" style={{ width: size, height: size, background: "var(--v3-avatar)", boxShadow: "var(--v3-shadow-card)" }} />
  );
}

export type Refs = { bubble?: string; avatar?: string; pie?: string };
type Props = { role: ChatMsg["role"]; text: string; label: string; visual?: ChatMsg["visual"]; fresh?: boolean; refs?: Refs };

/** Одна реплика. Свежая въезжает снизу (appear); история стоит на месте. */
export function V3Bubble({ role, text, label, visual, fresh = false, refs }: Props) {
  const { reduced, transitions } = useMotion();
  const { t } = useT();
  const mine = role === "child";
  return (
    <motion.li
      className={`flex items-start gap-[9px] ${mine ? "justify-end" : "-ml-0.5"}`}
      initial={fresh && !reduced ? { opacity: 0, y: 14, scale: 0.96 } : false}
      animate={{ opacity: 1, y: 0, scale: 1, transition: transitions.appear }}
      style={{ transformOrigin: mine ? "100% 100%" : "0% 100%" }}
    >
      {!mine && <div className="mt-1"><Avatar who={role as Partner} size={46} dataRef={refs?.avatar} /></div>}
      <div data-ref={refs?.bubble} className={`${BUBBLE} ${mine ? "max-w-[calc(100%-56px)]" : "max-w-[calc(100%-62px)]"}`} style={mine ? MINE : THEIRS}>
        <span className="sr-only">{label}: </span>
        {text.replace(MASK, t("chatv3.masked"))}
        {visual && <div className="mt-1 flex justify-center"><V3Pie fraction={visual.fraction} dataRef={refs?.pie} className="block size-[104px]" /></div>}
      </div>
    </motion.li>
  );
}

/** Сообщение из истории: свежим считается пришедшее только что (сервер ставит ts). */
export function V3MessageRow({ m, label, refs }: { m: ChatMsg; label: string; refs?: Refs }) {
  const [fresh] = useState(() => Date.now() - m.ts < FRESH_MS);
  return <V3Bubble role={m.role} text={m.text} label={label} visual={m.visual} fresh={fresh} refs={refs} />;
}

/** Ждём ответ: три точки в пузыре собеседника. */
export function V3Typing({ who, label }: { who: Partner; label: string }) {
  const { reduced, transitions } = useMotion();
  return (
    <motion.li role="status" className="-ml-0.5 flex items-start gap-[9px]" initial={reduced ? false : { opacity: 0, y: 10, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1, transition: transitions.appear }} style={{ transformOrigin: "0% 100%" }}>
      <div className="mt-1"><Avatar who={who} size={46} /></div>
      <span className="flex h-12 items-center gap-1.5 px-5" style={THEIRS}>
        <span className="sr-only">{label}</span>
        {[0, 1, 2].map((i) => (
          <motion.span key={i} aria-hidden className="block size-2.5 rounded-full" style={{ background: "var(--v3-ink-soft)" }}
            animate={reduced ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: THINKING.dotPeriodS, repeat: Infinity, delay: i * THINKING.dotStepS, ease: "easeInOut" }} />
        ))}
      </span>
    </motion.li>
  );
}
