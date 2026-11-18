"use client";
// Вместо поля ввода: спокойная плашка по причине закрытия и путь в махаллю. Без красного и без вины.
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";
import { WAIT_SHOW_MIN, type ChatData } from "./model";

export function ClosedPanel({ access, onLeave }: { access: ChatData["access"]; onLeave: () => void }) {
  const { t } = useT();
  const reason = access.reason ?? "day_limit";
  const wait = reason !== "crisis_block" && access.minutesLeft > 0 && access.minutesLeft <= WAIT_SHOW_MIN;
  return (
    <div
      className="flex flex-col items-start gap-3 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderTop: "var(--stroke-ink) solid var(--color-ink)" }}
    >
      <div className="min-w-0">
        <p className="text-body text-ink">{t(`chat.closed.${reason}`)}</p>
        {wait && <p className="text-label text-ink-muted tabular">{t("chat.closed.wait").replace("{n}", String(access.minutesLeft))}</p>}
      </div>
      <PressButton onClick={onLeave}>{t("chat.closed.back")}</PressButton>
    </div>
  );
}
