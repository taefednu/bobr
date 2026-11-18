"use client";
// Экран /home по эталону docs/design/v3/1-home.png. Живая страница и /dev/v3/home рендерят этот компонент;
// все числа и тема приходят пропсами из home:view, тексты из i18n. Блоки размечены data-ref по measure/home.json.
import { motion } from "framer-motion";
import Link from "next/link";
import { V3Card, V3RoundButton, V3Screen, IconArrowRight } from "@/components/v3";
import { useT } from "@/lib/i18n";
import { Alive, CountUp, useReveal } from "@/components/v3/motion";
import { EASE, PRESS, REVEAL, VIZ, useMotion } from "@/lib/motion";

export type HomeData = {
  next: { topic: string; title: string; percent: number } | null;
  taught: number;
  plan: { done: number; total: number };
  teachTopic: string | null;
};

const CATS = [
  { key: "ustoz", img: "cat-ustoz", href: "/chat?who=ustoz" },
  { key: "bobr", img: "cat-bobr", href: "/chat?who=bobr" },
  { key: "path", img: "cat-path", href: "/house" },
] as const;

const R = 11, C = 2 * Math.PI * R;
/** Кольцо и проценты стартуют, когда баннер уже на месте (он пятый в каскаде). */
const heroInMs = Math.min(4 * REVEAL.stepS, REVEAL.maxS) * 1000 + VIZ.startMs;
const MotionLink = motion.create(Link);

/** Кольцо доли: дуга из percent, никаких чисел внутри. */
function Ring({ percent }: { percent: number }) {
  return (
    <svg width="27" height="27" viewBox="0 0 28 28" aria-hidden className="-rotate-90">
      <circle cx="14" cy="14" r={R} fill="none" strokeWidth="5" stroke="color-mix(in oklch, var(--v3-ring) 10%, var(--v3-mint))" />
      {percent > 0 && <circle cx="14" cy="14" r={R} fill="none" strokeWidth="5" strokeLinecap="round" stroke="var(--v3-ring)"
        className="v3-viz" style={{ animation: `v3-viz-ring ${VIZ.ringMs}ms cubic-bezier(${EASE.out.join(",")}) ${heroInMs}ms backwards` }}
        strokeDasharray={`${(C * Math.min(100, Math.max(0, percent))) / 100} ${C}`} />}
    </svg>
  );
}

export function HomeView({ data, onStart, onTeach, notice }: {
  data: HomeData | null; onStart: (topic: string) => void; onTeach: (topic: string) => void; notice?: string | null;
}) {
  const { t } = useT();
  const { reduced: calm, transitions } = useMotion();
  const reveal = useReveal();
  const next = data?.next ?? null;
  const teachTopic = data?.teachTopic ?? null;

  return (
    <V3Screen tab="home">
      <motion.h1 {...reveal(0)} data-ref="greeting" className="v3-type-greeting mx-auto mt-[52px] flex h-[38px] w-[190px] items-center justify-center gap-1 whitespace-nowrap" style={{ color: "var(--v3-title)" }}>
        <span>{t("home.greeting")}</span>
        <motion.img src="/v3/hand-wave.png" alt="" aria-hidden width={46} height={43} className="max-w-none" draggable={false}
          style={{ transformOrigin: "70% 85%" }}
          animate={calm ? undefined : { rotate: [0, 16, -8, 14, -4, 0] }} transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }} />
      </motion.h1>

      <div className="mx-2 mt-[22px] flex justify-between">
        {CATS.map((c, i) => {
          return (
            <MotionLink key={c.key} href={c.href} {...reveal(1 + i)} whileTap={{ scale: PRESS.scale }} transition={transitions.press} className="block w-[78px]">
              <span data-ref={`cat${i + 1}`} className="flex h-[78px] w-[78px] items-center justify-center rounded-full"
                style={{ background: "var(--v3-circle)", boxShadow: "var(--v3-shadow-card)" }}>
                <img src={`/v3/${c.img}.png`} alt="" aria-hidden draggable={false} className="h-[78px] w-[78px] max-w-none" />
              </span>
              <span data-ref={`catLabel${i + 1}`} className="v3-type-label mt-2 block h-4 w-[78px] whitespace-nowrap text-center" style={{ lineHeight: "16px", color: "var(--v3-label)" }}>
                {t(`home.cat.${c.key}`)}
              </span>
            </MotionLink>
          );
        })}
      </div>

      {data && (
        <V3Card as={motion.div} {...reveal(4)} radius="banner" data-ref="hero" className="mt-[22px] flex flex-col overflow-hidden p-4">
          <img src="/v3/hero-leaves.png" alt="" aria-hidden width={66} height={58} draggable={false} className="absolute bottom-4 left-[14px]" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pl-1 pt-[10px]">
              <h2 data-ref="heroTitle" className="v3-type-banner w-fit" style={{ lineHeight: "24px", color: "var(--v3-title)" }}>
                {next ? next.title : t("home.empty.title")}
              </h2>
              {next ? (
                <div data-ref="heroProgress" role="img" aria-label={t("home.hero.progress").replace("{n}", String(next.percent))}
                  className="mt-[11px] flex h-[38px] w-[100px] items-center justify-between rounded-full pl-[14px] pr-[10px]"
                  style={{ background: "var(--v3-mint)" }}>
                  <CountUp value={next.percent} suffix="%" delayMs={heroInMs} className="text-[19px] font-bold leading-none" style={{ fontVariantNumeric: "tabular-nums", color: "var(--v3-title)" }} />
                  <Ring percent={next.percent} />
                </div>
              ) : (
                <p className="v3-type-caption mt-[11px]" style={{ color: "var(--v3-ink-soft)" }}>{t("home.empty.sub")}</p>
              )}
            </div>
            {next ? (
              <V3RoundButton data-ref="heroGo" label={t("home.hero.start")} onClick={() => onStart(next.topic)}><IconArrowRight /></V3RoundButton>
            ) : teachTopic ? (
              <V3RoundButton data-ref="heroGo" label={t("home.empty.title")} onClick={() => onTeach(teachTopic)}><IconArrowRight /></V3RoundButton>
            ) : (
              <V3RoundButton data-ref="heroGo" label={t("home.empty.title")} href="/house"><IconArrowRight /></V3RoundButton>
            )}
          </div>
          <Alive who="bobr" className="-mb-4 -mr-1 mt-[-20px] h-[167px] w-[250px] shrink-0 self-end">
            <img data-ref="heroArt" src="/v3/hero-bobr-non.png" alt="" aria-hidden width={250} height={167} draggable={false}
              className="h-[167px] w-[250px] max-w-none" />
          </Alive>
        </V3Card>
      )}

      <motion.h2 {...reveal(5)} data-ref="section" className="v3-type-section mt-[26px] ml-2 w-fit" style={{ lineHeight: "20px", color: "var(--v3-title)" }}>{t("home.section")}</motion.h2>

      {([
        { id: "card1", who: "ustoz", art: "card-ustoz", w: 128, h: 91, mr: 10, gap: 9 },
        { id: "card2", who: "bobr", art: "card-bobr", w: 126, h: 87, mr: 12, gap: 8 },
      ] as const).map((c, i) => (
        <V3Card key={c.id} as={MotionLink} href={`/chat?who=${c.who}`} {...reveal(6 + i)} whileTap={{ scale: PRESS.scale }} transition={transitions.press} tone="warm" data-ref={c.id}
          className={`${i ? "mt-[10px] -mb-[22px]" : "mt-4"} flex h-[98px] items-stretch overflow-hidden`}>
          <div className="flex min-w-0 flex-col justify-center pl-5">
            <span data-ref={`${c.id}Title`} className="v3-type-card block w-fit" style={{ lineHeight: "20px", color: "var(--v3-title)" }}>{t(`home.card.${c.who}.title`)}</span>
            <span data-ref={`${c.id}Sub`} className="v3-type-caption block w-fit" style={{ lineHeight: "16px", marginTop: c.gap, color: "var(--v3-sub)" }}>{t(`home.card.${c.who}.sub`)}</span>
          </div>
          <Alive who={c.who} className="ml-auto shrink-0 self-end" style={{ width: c.w, height: c.h, marginRight: c.mr }}>
            <img data-ref={`${c.id}Art`} src={`/v3/${c.art}.png`} alt="" aria-hidden width={c.w} height={c.h} draggable={false}
              className="max-w-none" style={{ width: c.w, height: c.h }} />
          </Alive>
        </V3Card>
      ))}

      {notice && (
        <V3Card role="alert" tone="warm" className="v3-type-caption fixed inset-x-4 z-50 mx-auto max-w-[358px] px-5 py-3"
          style={{ bottom: "calc(var(--v3-nav-h) + var(--v3-nav-gap) + 12px)" }}>{notice}</V3Card>
      )}
    </V3Screen>
  );
}
