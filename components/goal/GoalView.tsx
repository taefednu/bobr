"use client";
import { CharacterSays } from "@/components/child/CharacterSays";
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";
import { GOAL_INTENTS, type GoalIntent } from "@/lib/ui/types";

type Props = {
  /** null — ещё не выбрал: Bobr спрашивает, видны три кнопки. */
  intent: GoalIntent | null;
  onPick: (intent: GoalIntent) => void;
  onContinue: () => void;
};

export function GoalView({ intent, onPick, onContinue }: Props) {
  const { t } = useT();
  return (
    // На десктопе колонка стоит чуть ниже верха, а не прилипает к шапке; на телефоне идёт сверху.
    <div className="flex flex-col gap-6 sm:pt-[8vh]">
      <h1 className="font-display text-title font-bold">{t("goal.title")}</h1>
      <CharacterSays who="bobr">{intent ? t(`goal.reply.${intent}`) : t("goal.ask")}</CharacterSays>
      <div className="flex flex-col gap-4 pt-2">
        {intent ? (
          <PressButton fullWidth onClick={onContinue}>{t("goal.continue")}</PressButton>
        ) : (
          GOAL_INTENTS.map((i) => (
            <PressButton key={i} variant="secondary" fullWidth onClick={() => onPick(i)}>
              {t(`goal.btn.${i}`)}
            </PressButton>
          ))
        )}
      </div>
    </div>
  );
}
