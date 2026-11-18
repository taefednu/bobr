"use client";
// Махалля (DESIGN.md §2, §5, §6): диорама из 10 домов на тёплой земле. Улицы — по prereqs, под домами.
// Чем ниже дом на экране, тем он ближе и рисуется позже. Состояние дома рисует House, здесь его не красим.
import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/child/Card";
import { House } from "@/components/mahalla/House";
import { TileBand } from "@/components/mahalla/TileBand";
import {
  PHONE, PHONE_ANCHOR_Y, PHONE_ASPECT, PHONE_W, WIDE, WIDE_ANCHOR_Y, WIDE_ASPECT, WIDE_W, type Spot,
} from "@/components/mahalla/layout";
import { PressButton } from "@/components/ui/press-button";
import { useT, type Key } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import type { MahallaView as View } from "@/lib/ui/demo-data";

type H = View["houses"][number];

/** Улицы: широкая песочная полоса и тонкий пунктир по ней; координаты в % рамки, толщина не масштабируется. */
function Streets({ houses, spots, anchorY, className }: { houses: H[]; spots: Record<string, Spot>; anchorY: number; className: string }) {
  const at = (id: string) => spots[id] && ([spots[id][0], spots[id][1] + anchorY] as const);
  const lines = houses.flatMap((h) =>
    h.prereqs.flatMap((p) => {
      const a = at(p);
      const b = at(h.topic);
      return a && b ? [{ key: `${p}-${h.topic}`, d: `M${a[0]} ${a[1]} L${b[0]} ${b[1]}` }] : [];
    }),
  );
  const common = { fill: "none", vectorEffect: "non-scaling-stroke", strokeLinecap: "round" } as const;
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className={`absolute inset-0 size-full ${className}`}>
      {lines.map((l) => (
        <g key={l.key}>
          <path d={l.d} {...common} style={{ stroke: "var(--color-sand)", strokeWidth: 14 }} />
          <path d={l.d} {...common} style={{ stroke: "var(--color-ink-muted)", strokeWidth: "var(--stroke-ink-thin)", strokeDasharray: "2 8" }} />
        </g>
      ))}
    </svg>
  );
}

function HouseSpot({ h, selected, isNext, rank, onPick }: { h: H; selected: boolean; isNext: boolean; rank: number; onPick: () => void }) {
  const { t } = useT();
  const { transitions, targets } = useMotion();
  const label = t(`mahalla.house.${h.state}` as Key);
  const p = PHONE[h.topic] ?? [50, 0];
  const w = WIDE[h.topic] ?? [50, 0];
  return (
    <div
      className="absolute w-[var(--bw)] md:w-[var(--bww)] -translate-x-1/2 left-[var(--px)] top-[var(--py)] md:left-[var(--wx)] md:top-[var(--wy)]"
      style={
        {
          zIndex: rank + 1,
          "--px": `${p[0]}%`, "--py": `${p[1]}%`, "--wx": `${w[0]}%`, "--wy": `${w[1]}%`,
          "--bw": `${PHONE_W}%`, "--bww": `${WIDE_W}%`,
        } as CSSProperties
      }
    >
      <motion.button
        type="button"
        aria-label={`${h.title}, ${label}${isNext ? `, ${t("mahalla.next")}` : ""}`}
        aria-pressed={selected}
        onClick={onPick}
        whileTap={{ y: targets.pressDepthPx }}
        transition={transitions.press}
        className="relative flex min-h-11 w-full cursor-pointer flex-col items-center bg-transparent p-0 outline-none focus-visible:[outline:var(--focus-ring)] focus-visible:outline-offset-2"
      >
        {isNext && (
          <span
            aria-hidden
            className="absolute -top-2 z-10 whitespace-nowrap rounded-full bg-apricot px-2 text-label text-ink"
            style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
          >
            {t("mahalla.next")}
          </span>
        )}
        <span className="block w-[87%] md:w-[82%] [&>svg]:h-auto [&>svg]:w-full">
          <House state={h.state} />
        </span>
        <span
          className={`mt-1 block max-w-full rounded-md px-2 py-0.5 text-center text-label ${selected ? "bg-ink text-paper" : "bg-paper text-ink"}`}
          style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
        >
          {h.title}
        </span>
      </motion.button>
    </div>
  );
}

export function MahallaView({ view, onStart }: { view: View; onStart: (topic: string) => void }) {
  const { t } = useT();
  const [picked, setPicked] = useState<string | null>(null);
  const sel = view.houses.find((h) => h.topic === (picked ?? view.next)) ?? null;
  const rank = new Map([...view.houses].sort((a, b) => (PHONE[a.topic]?.[1] ?? 0) - (PHONE[b.topic]?.[1] ?? 0)).map((h, i) => [h.topic, i]));
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-display font-bold">{t("mahalla.title")}</h1>
      <TileBand />
      {/* Рамка карты: на телефоне высокая, на ≥ md широкая; дома и улицы стоят в процентах рамки. */}
      <div
        className="relative isolate mx-auto w-full max-w-[420px] rounded-xl bg-clay-100 shadow-well [aspect-ratio:var(--ar-phone)] md:max-w-none md:[aspect-ratio:var(--ar-wide)]"
        style={{ "--ar-phone": PHONE_ASPECT, "--ar-wide": WIDE_ASPECT } as CSSProperties}
      >
        <Streets houses={view.houses} spots={PHONE} anchorY={PHONE_ANCHOR_Y} className="md:hidden" />
        <Streets houses={view.houses} spots={WIDE} anchorY={WIDE_ANCHOR_Y} className="hidden md:block" />
        {view.houses.map((h) => (
          <HouseSpot key={h.topic} h={h} selected={h.topic === sel?.topic} isNext={h.topic === view.next} rank={rank.get(h.topic) ?? 0} onPick={() => setPicked(h.topic)} />
        ))}
      </div>
      {sel && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-title font-bold">{sel.title}</h2>
          <p className="text-body text-ink-muted">{t(`mahalla.house.${sel.state}` as Key)}</p>
          {sel.canStart && (
            <div>
              <PressButton onClick={() => onStart(sel.topic)}>{t("mahalla.start")}</PressButton>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
