"use client";
import { Shell } from "@/components/skeleton/Shell";
import { useT } from "@/lib/i18n";

export default function ParentPage() {
  const { t } = useT();
  return (
    <Shell>
      <h1 className="text-xl font-bold">{t("parent.title")}</h1>
      <p className="border border-ink-muted bg-paper p-3">{t("parent.summary")}</p>
      <p className="text-sm text-ink-muted">{t("parent.note")}</p>
    </Shell>
  );
}
