"use client";
import { useT } from "@/lib/i18n";
import { Character } from "@/components/skeleton/Shell";
export default function Page() {
  const { t } = useT();
  return (
    <>
      <h1 className="text-xl font-bold">{t("goal.title")}</h1>
      <Character who="bobr" />
      <div className="flex flex-col gap-2">
        <button type="button" className="border border-ink-muted bg-paper px-4 py-2 text-base text-ink">{t("goal.test")}</button>
        <button type="button" className="border border-ink-muted bg-paper px-4 py-2 text-base text-ink">{t("goal.homework")}</button>
        <button type="button" className="border border-ink-muted bg-paper px-4 py-2 text-base text-ink">{t("goal.unknown")}</button>
      </div>
    </>
  );
}
