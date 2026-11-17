"use client";
import { useT } from "@/lib/i18n";
import { Character } from "@/components/skeleton/Shell";
export default function Page() {
  const { t } = useT();
  return (
    <>
      <h1 className="text-xl font-bold">{t("lesson.title")}</h1>
      <Character who="ustoz" />
      <p className="border border-ink-muted bg-paper p-3">{t("lesson.task")}</p>
      <input aria-label={t("lesson.answer")} placeholder={t("lesson.answer")} className="border border-ink-muted bg-paper px-3 py-2 text-base text-ink" />
      <button type="button" className="border border-ink-muted bg-paper px-4 py-2 text-base text-ink">{t("lesson.check")}</button>
    </>
  );
}
