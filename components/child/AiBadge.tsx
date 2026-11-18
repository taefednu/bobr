"use client";
// Плашка ИИ (DESIGN.md §5): всегда видна, без анимации, не мельче text-label. Длинный uz-текст переносится.
import { useT } from "@/lib/i18n";

export function AiBadge() {
  const { t } = useT();
  return (
    <p
      role="note"
      className="w-fit max-w-full rounded-full bg-clay-100 px-4 py-1 text-label text-ink-muted"
      style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
    >
      {t("ai.badge")}
    </p>
  );
}
