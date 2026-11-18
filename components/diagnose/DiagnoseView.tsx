"use client";
// Диагностика в языке v3. Пробы, варианты и ожидание те же; вердикт считает сервер, здесь его нет.
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { V3Card } from "@/components/v3";
import { Cta, Note, OnboardScreen, ProbePie, Rise, Say, V3Frac } from "@/components/v3/onboarding/parts";
import { useReveal } from "@/components/v3/motion";
import { useT } from "@/lib/i18n";
import { PRESS, useMotion } from "@/lib/motion";
import { fill } from "@/lib/ui/fill";
import type { DiagnoseView as View } from "@/lib/ui/types";

type Props = {
  view: View;
  busy: boolean;
  failed?: boolean;
  onAnswer: (probeId: string, value: string) => void;
  onDone: () => void;
};

type Probe = NonNullable<View["probe"]>;

const NUM = 46;
const Op = ({ children }: { children: ReactNode }) => (
  <span aria-hidden className="text-[34px] leading-none font-extrabold" style={{ color: "var(--v3-ink-soft)" }}>{children}</span>
);

// Форма params решает, как рисовать: незнакомая проба от бэкенда всё равно покажется.
function Expression({ probe }: { probe: Probe }) {
  const { t } = useT();
  const p = probe.params;
  const has = (...ks: string[]) => ks.every((k) => k in p); // порядок проверок ниже: от самой полной формы
  const row = (children: ReactNode) => <div className="flex flex-wrap items-center justify-center gap-4">{children}</div>;
  const ask = (text: string) => <p className="v3-type-label text-center" style={{ color: "var(--v3-ink-soft)" }}>{text}</p>;

  if (has("a", "b", "c", "d")) {
    return (
      <>
        {row(<><V3Frac value={`${p.a}/${p.b}`} size={NUM} /><Op>+</Op><V3Frac value={`${p.c}/${p.d}`} size={NUM} /></>)}
        {ask(t("diagnose.probe.add"))}
      </>
    );
  }
  if (has("a", "c", "den")) {
    return (
      <>
        {row(<><V3Frac value={`${p.a}/${p.den}`} size={NUM} /><Op>+</Op><V3Frac value={`${p.c}/${p.den}`} size={NUM} /></>)}
        {ask(t("diagnose.probe.add"))}
      </>
    );
  }
  if (has("num", "den", "toDen")) {
    return (
      <>
        {row(<><V3Frac value={`${p.num}/${p.den}`} size={NUM} /><Op>=</Op><V3Frac value={`?/${p.toDen}`} size={NUM} /></>)}
        {ask(t("diagnose.probe.equiv"))}
      </>
    );
  }
  if (has("num", "den")) {
    return (
      <>
        {row(<ProbePie value={`${p.num}/${p.den}`} label={t("onboard.diag.pieAria")} />)}
        {ask(t("diagnose.probe.part"))}
      </>
    );
  }
  if (has("a", "b")) {
    return <p className="v3-type-section text-center">{fill(t("diagnose.probe.lcm"), p)}</p>;
  }
  return <p className="text-center text-[40px] leading-[44px] font-extrabold tabular-nums">{probe.numbersShown.join(" ")}</p>;
}

// Выбранный вариант подсвечен, пока сервер не ответил; новая проба (key) сбрасывает выбор.
function Options({ probe, busy, onAnswer }: { probe: Probe; busy: boolean; onAnswer: Props["onAnswer"] }) {
  const { t } = useT();
  const [picked, setPicked] = useState<string | null>(null);
  const reveal = useReveal();
  const { transitions } = useMotion();
  return (
    <div role="group" aria-label={t("onboard.diag.options")} data-ref="options" className="grid grid-cols-2 gap-3">
      {probe.options.map((o, i) => (
        <V3Card key={o} as={motion.button} {...reveal(1 + i)} whileTap={{ scale: PRESS.scale }} transition={transitions.press} type="button" tone="circle" radius="card" disabled={busy} aria-pressed={picked === o}
          onClick={() => { setPicked(o); onAnswer(probe.id, o); }}
          className="flex min-h-[92px] cursor-pointer items-center justify-center px-3 py-4 disabled:cursor-default"
          style={picked === o ? { outline: "3px solid var(--v3-teal-strong)", outlineOffset: -3 } : undefined}>
          <V3Frac value={o} size={36} />
        </V3Card>
      ))}
    </div>
  );
}

export function DiagnoseView({ view, busy, failed, onAnswer, onDone }: Props) {
  const { t } = useT();
  const probe = view.probe;

  if (!probe) {
    return (
      <OnboardScreen cta={<Cta onClick={onDone}>{t("diagnose.toPlan")}</Cta>}>
        <h1 className="v3-type-banner">{t("diagnose.heading")}</h1>
        <Rise><Say who="ustoz">{t("diagnose.done")}</Say></Rise>
        {failed && <Note>{t("lesson.error")}</Note>}
      </OnboardScreen>
    );
  }

  const say = busy ? t("diagnose.thinking") : view.asked === 0 ? t("diagnose.intro") : t("diagnose.ack");
  return (
    <OnboardScreen>
      <div>
        <p className="v3-type-caption" style={{ color: "var(--v3-ink-soft)" }}>{fill(t("onboard.diag.progress"), { n: String(view.asked + 1) })}</p>
        <h1 className="v3-type-banner">{t("diagnose.heading")}</h1>
      </div>
      <Say who="ustoz"><span role={busy ? "status" : undefined}>{say}</span></Say>
      <Rise key={`probe-${probe.id}`}>
        <V3Card radius="banner" data-ref="probe" className="flex min-h-[176px] flex-col items-center justify-center gap-4 px-4 py-6">
          <Expression probe={probe} />
        </V3Card>
      </Rise>
      <Options key={`opts-${probe.id}`} probe={probe} busy={busy} onAnswer={onAnswer} />
      {failed && <Note>{t("lesson.error")}</Note>}
    </OnboardScreen>
  );
}
