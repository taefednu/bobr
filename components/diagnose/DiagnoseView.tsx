"use client";
import type { ReactNode } from "react";
import { Card } from "@/components/child/Card";
import { CharacterSays } from "@/components/child/CharacterSays";
import { Fraction } from "@/components/child/Fraction";
import { Pie } from "@/components/fractions/Pie";
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";
import { fill } from "@/lib/ui/fill";
import type { DiagnoseView as View } from "@/lib/ui/types";

type Props = {
  view: View;
  busy: boolean;
  onAnswer: (probeId: string, value: string) => void;
  onDone: () => void;
};

type Probe = NonNullable<View["probe"]>;

const NUM = "text-numeral";
const Op = ({ children }: { children: ReactNode }) => (
  <span aria-hidden className="font-display text-numeral font-bold text-ink-muted">{children}</span>
);

// Форма params решает, как рисовать: незнакомая проба от бэкенда всё равно покажется.
function Expression({ probe }: { probe: Probe }) {
  const { t } = useT();
  const p = probe.params;
  const has = (...ks: string[]) => ks.every((k) => k in p); // порядок проверок ниже: от самой полной формы
  const row = (children: ReactNode) => <div className="flex flex-wrap items-center justify-center gap-4">{children}</div>;
  const ask = (text: string) => <p className="text-center text-body text-ink-muted">{text}</p>;

  if (has("a", "b", "c", "d")) {
    return (
      <>
        {row(<><Fraction value={`${p.a}/${p.b}`} className={NUM} /><Op>+</Op><Fraction value={`${p.c}/${p.d}`} className={NUM} /></>)}
        {ask(t("diagnose.probe.add"))}
      </>
    );
  }
  if (has("a", "c", "den")) {
    return (
      <>
        {row(<><Fraction value={`${p.a}/${p.den}`} className={NUM} /><Op>+</Op><Fraction value={`${p.c}/${p.den}`} className={NUM} /></>)}
        {ask(t("diagnose.probe.add"))}
      </>
    );
  }
  if (has("num", "den", "toDen")) {
    return (
      <>
        {row(<><Fraction value={`${p.num}/${p.den}`} className={NUM} /><Op>=</Op><Fraction value={`?/${p.toDen}`} className={NUM} /></>)}
        {ask(t("diagnose.probe.equiv"))}
      </>
    );
  }
  if (has("num", "den")) {
    return (
      <>
        {row(<Pie value={`${p.num}/${p.den}`} hideValue />)}
        {ask(t("diagnose.probe.part"))}
      </>
    );
  }
  if (has("a", "b")) {
    return <p className="text-center font-display text-title font-bold">{fill(t("diagnose.probe.lcm"), p)}</p>;
  }
  return <p className="text-center font-display text-numeral font-bold tabular">{probe.numbersShown.join(" ")}</p>;
}

export function DiagnoseView({ view, busy, onAnswer, onDone }: Props) {
  const { t } = useT();
  const probe = view.probe;

  if (!probe) {
    return (
      <div className="flex flex-col gap-6 sm:pt-[8vh]">
        <h1 className="font-display text-title font-bold">{t("diagnose.heading")}</h1>
        <CharacterSays who="ustoz">{t("diagnose.done")}</CharacterSays>
        <PressButton fullWidth onClick={onDone}>{t("diagnose.toPlan")}</PressButton>
      </div>
    );
  }

  const say = busy ? t("diagnose.thinking") : view.asked === 0 ? t("diagnose.intro") : t("diagnose.ack");
  return (
    <div className="flex flex-col gap-6 sm:pt-[8vh]">
      <h1 className="font-display text-title font-bold">{t("diagnose.heading")}</h1>
      <CharacterSays who="ustoz">{say}</CharacterSays>
      <Card className="flex flex-col gap-4">
        <Expression probe={probe} />
      </Card>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {probe.options.map((o) => (
          <PressButton key={probe.id + o} variant="secondary" fullWidth tall disabled={busy} onClick={() => onAnswer(probe.id, o)}>
            <Fraction value={o} className="text-title" />
          </PressButton>
        ))}
      </div>
    </div>
  );
}
