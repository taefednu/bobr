"use client";
import { useT } from "@/lib/i18n";
import { Character } from "@/components/skeleton/Shell";
export default function Page() {
  const { t } = useT();
  return (
    <>
      <h1 className="text-xl font-bold">{t("chat.title")}</h1>
      <Character who="bobr" />
      <p className="min-h-32 border border-ink-muted bg-paper p-3 text-ink-muted">{t("chat.empty")}</p>
      <input aria-label={t("chat.placeholder")} placeholder={t("chat.placeholder")} className="border border-ink-muted bg-paper px-3 py-2 text-base text-ink" />
      <button type="button" className="border border-ink-muted bg-paper px-4 py-2 text-base text-ink">{t("chat.send")}</button>
    </>
  );
}
