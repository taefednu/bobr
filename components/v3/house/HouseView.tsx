"use client";
// /house: остров-картинка и шесть кликабельных камней поверх неё (решение владельца 18.11: простой экран).
import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { V3RoundButton, V3Screen, V3Sheet, IconArrowLeft, IconDots } from "@/components/v3";
import { useT } from "@/lib/i18n";
import { EASE, TARGETS, useMotion } from "@/lib/motion";

export type HouseData = {
  levels: { n: number; topic: string; title: string; state: "done" | "current" | "next" | "review"; canStart: boolean }[];
};

// Камни level1…6 из docs/design/v3/measure/house.json в долях кадра острова (x5 y212 w380 h513); тап-цель не меньше 44 px.
const ISLAND = { x: 5, y: 212, w: 380, h: 513 };
const STONES = [
  { x: 160, y: 603, s: 56 }, { x: 215, y: 549, s: 58 }, { x: 295, y: 502, s: 52 },
  { x: 263, y: 458, s: 48 }, { x: 306, y: 420, s: 44 }, { x: 255, y: 390, s: 42 },
].map((b, i) => ({
  n: i + 1,
  cx: ((b.x + b.s / 2 - ISLAND.x) / ISLAND.w) * 100,
  cy: ((b.y + b.s / 2 - ISLAND.y) / ISLAND.h) * 100,
  size: Math.max(b.s, 44),
}));

type Level = HouseData["levels"][number];
type Sheet = { kind: "closed"; n: number } | { kind: "error" } | { kind: "more" } | null;

export function HouseView({ data, onBack, onStart }: { data: HouseData; onBack: () => void; onStart: (topic: string) => Promise<boolean> }) {
  const { t } = useT();
  const { reduced, transitions } = useMotion();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [pending, setPending] = useState<string | null>(null);
  const busy = useRef(false);

  async function pick(n: number) {
    const l = data.levels.find((x) => x.n === n);
    if (!l || !l.canStart) return setSheet({ kind: "closed", n });
    if (busy.current) return;
    busy.current = true;
    setPending(l.topic);
    try {
      if (!(await onStart(l.topic))) setSheet({ kind: "error" });
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  return (
    <V3Screen>
      <header className="mx-[5px] flex items-center gap-[14px] pt-[30px]">
        <V3RoundButton data-ref="back" label={t("child.back")} size={62} tone="round" onClick={onBack}><IconArrowLeft size={30} /></V3RoundButton>
        <h1
          data-ref="title"
          className="v3-type-banner flex h-[62px] w-[196px] min-w-0 shrink-0 items-center justify-center rounded-full px-3 text-center"
          style={{ background: "linear-gradient(to bottom, var(--v3-blue-top), var(--v3-blue-bottom))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" }}
        >
          {t("house.title")}
        </h1>
        <V3RoundButton data-ref="more" label={t("house.more")} size={62} tone="round" onClick={() => setSheet({ kind: "more" })}><IconDots size={30} /></V3RoundButton>
      </header>

      <div className="relative mt-[120px] h-[513px] w-[380px] max-w-none" style={{ marginLeft: "calc(50% - 190px)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- вырезку агент ассетов подменит под тем же именем */}
        <img data-ref="island" src="/v3/house-island.png" alt={t("house.scene")} width={380} height={513} className="block h-full w-full select-none" draggable={false} />
        {STONES.map((s) => {
          const l = data.levels.find((x) => x.n === s.n);
          const mine = pending !== null && pending === l?.topic;
          const current = l?.state === "current";
          const label = l ? t("house.level.aria").replace("{n}", String(s.n)).replace("{topic}", l.title) : t("house.sheet.levelTitle").replace("{n}", String(s.n));
          return (
            <motion.button
              key={s.n}
              type="button"
              data-ref={`level${s.n}`}
              aria-label={l ? `${label}. ${t(`house.state.${l.state}`)}` : label}
              aria-current={current ? "step" : undefined}
              aria-busy={mine}
              disabled={pending !== null}
              onClick={() => void pick(s.n)}
              whileTap={{ scale: 0.86, y: TARGETS.pressDepthPx / 2 }}
              transition={transitions.press}
              className="absolute cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--v3-blue-top)] disabled:cursor-default"
              style={{ left: `calc(${s.cx}% - ${s.size / 2}px)`, top: `calc(${s.cy}% - ${s.size / 2}px)`, width: s.size, height: s.size, filter: pending !== null && !mine ? "saturate(0.4) brightness(0.92)" : undefined }}
            >
              {mine && !reduced && (
                <motion.span aria-hidden className="absolute inset-0 rounded-full" style={{ border: "3px solid var(--v3-sun-deep)" }}
                  animate={{ opacity: [0.9, 0], scale: [1, 1.7] }} transition={{ duration: 0.9, ease: EASE.out, repeat: Infinity }} />
              )}
              <Stone n={s.n} state={l?.state} pending={mine} />
            </motion.button>
          );
        })}
      </div>

      <V3Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheetTitle(sheet, t)}>
        <p className="v3-type-caption" style={{ color: "var(--v3-ink-soft)" }}>{sheet && t(`house.${sheet.kind === "closed" ? "sheet.closed" : sheet.kind === "error" ? "sheet.error" : "more.text"}`)}</p>
        {sheet?.kind === "more" ? (
          <Link href="/plan" data-autofocus className="v3-type-label flex h-12 items-center justify-center rounded-full px-5" style={{ background: "linear-gradient(160deg, var(--v3-round), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" }}>
            {t("house.more.plan")}
          </Link>
        ) : (
          <button type="button" data-autofocus onClick={() => setSheet(null)} className="v3-type-label h-12 cursor-pointer rounded-full px-5" style={{ background: "var(--v3-circle)", boxShadow: "var(--v3-shadow-card)" }}>
            {t("nav.close")}
          </button>
        )}
      </V3Sheet>
    </V3Screen>
  );
}

function sheetTitle(s: Sheet, t: ReturnType<typeof useT>["t"]) {
  if (s?.kind === "closed") return t("house.sheet.levelTitle").replace("{n}", String(s.n));
  if (s?.kind === "error") return t("house.sheet.errorTitle");
  return t("house.title");
}

// Камень рисует код целиком: непрозрачная плашка закрывает запечённый в картинке камень (и свечение камня 2), число и состояние берутся из данных.
// Ассет без камней (ASSETS.md) от этого не меняется. Метка «пройден» стоит в потоке рядом с числом, внутри эллипса, и не вылезает за камень.
function Stone({ n, state, pending }: { n: number; state?: Level["state"]; pending: boolean }) {
  const current = state === "current";
  return (
    <>
      {/* ponytail: заплата цвета травы гасит ореол, запечённый в картинке вокруг камня 2; уйдёт вместе с камнями при замене house-island.png */}
      {!current && <span aria-hidden className="absolute -inset-[10px] rounded-full" style={{ background: "radial-gradient(closest-side, oklch(74% 0.15 125 / 0.9) 55%, transparent)" }} />}
    <span
      aria-hidden
      className="absolute inset-x-0 top-[14%] flex h-[72%] items-center justify-center gap-[3px] rounded-[50%]"
      style={{
        background: current ? "linear-gradient(to bottom, oklch(93% 0.1 90), var(--v3-sun))" : "linear-gradient(to bottom, var(--v3-card), var(--v3-card-warm))",
        boxShadow: current
          ? "0 4px 0 var(--v3-sun-deep), 0 0 0 3px var(--v3-on-teal), 0 0 0 5px var(--v3-sun-deep), 0 0 20px 6px oklch(84% 0.15 78 / 0.7)"
          : "0 4px 0 var(--v3-stone-rim), 0 7px 8px oklch(40% 0.06 60 / 0.25)",
        transform: current ? "scale(1.14)" : undefined,
        color: "var(--v3-ink)",
        font: "800 20px/1 var(--font-sans)",
        zIndex: current ? 1 : 0,
      }}
    >
      {pending ? <span className="tracking-[2px]">•••</span> : n}
      {state === "done" && !pending && (
        <span className="flex size-[13px] items-center justify-center rounded-full" style={{ background: "var(--v3-teal-strong)" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--v3-on-teal)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7" /></svg>
        </span>
      )}
    </span>
    </>
  );
}
