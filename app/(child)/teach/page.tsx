"use client";
import { useT } from "@/lib/i18n";
import { Character } from "@/components/skeleton/Shell";
export default function Page() {
  const { t } = useT();
  return (
    <>
      <h1 className="text-xl font-bold">{t("teach.title")}</h1>
      <Character who="bobr" />
      <textarea aria-label={t("teach.placeholder")} placeholder={t("teach.placeholder")} rows={5} className="border border-ink-muted bg-paper px-3 py-2 text-base text-ink" />
      <button type="button" className="border border-ink-muted bg-paper px-4 py-2 text-base text-ink">{t("teach.send")}</button>
    </>
  );
}
