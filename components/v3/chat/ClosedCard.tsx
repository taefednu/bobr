"use client";
// Вместо чипов и поля: спокойная карточка по причине закрытия и путь назад. Без красного и без вины.
import { WAIT_SHOW_MIN, type ChatData } from "@/components/chat/model";
import { V3Card } from "@/components/v3";
import { useT } from "@/lib/i18n";

export function V3ClosedCard({ access, onLeave }: { access: ChatData["access"]; onLeave: () => void }) {
  const { t } = useT();
  const reason = access.reason ?? "day_limit";
  const wait = reason !== "crisis_block" && access.minutesLeft > 0 && access.minutesLeft <= WAIT_SHOW_MIN;
  return (
    <V3Card radius="card" tone="card" className="flex flex-col gap-3 p-5">
      <p className="v3-type-chat">{t(`chat.closed.${reason}`)}</p>
      {wait && <p className="v3-type-caption tabular-nums" style={{ color: "var(--v3-ink-soft)" }}>{t("chat.closed.wait").replace("{n}", String(access.minutesLeft))}</p>}
      <button type="button" onClick={onLeave} className="v3-type-label min-h-12 cursor-pointer self-start rounded-full px-6 transition-transform duration-100 active:scale-95 motion-reduce:transition-none"
        style={{ background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" }}>
        {t("chat.closed.back")}
      </button>
    </V3Card>
  );
}
