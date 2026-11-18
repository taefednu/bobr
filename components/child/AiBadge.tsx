"use client";
// Плашка ИИ (DESIGN.md §5): всегда видна, без анимации, не мельче text-label. Стоит в верхней полосе; длинный uz-текст переносится.
import { useT } from "@/lib/i18n";

export function AiBadge() {
  const { t } = useT();
  return (
    <p
      role="note"
      className="w-fit max-w-full rounded-xl bg-clay-100 px-3 py-1.5 text-label text-ink-muted lg:rounded-full"
      style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
    >
      {t("ai.badge")}
    </p>
  );
}
