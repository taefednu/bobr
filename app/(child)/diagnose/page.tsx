"use client";
import { useT } from "@/lib/i18n";
import { Character } from "@/components/skeleton/Shell";
export default function Page() {
  const { t } = useT();
  return (
    <>
      <h1 className="text-xl font-bold">{t("diagnose.title")}</h1>
      <Character who="ustoz" />
      <p>{t("diagnose.placeholder")}</p>
    </>
  );
}
