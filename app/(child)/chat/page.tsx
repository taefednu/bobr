"use client";
import { CharacterSays } from "@/components/child/CharacterSays";
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";

// TODO(core): болталка ещё не подключена к бэкенду, поэтому отправка выключена.
export default function Page() {
  const { t } = useT();
  return (
    <>
      <h1 className="font-display text-title font-bold">{t("chat.title")}</h1>
      <CharacterSays who="bobr">{t("chat.empty")}</CharacterSays>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          aria-label={t("chat.placeholder")}
          placeholder={t("chat.placeholder")}
          className="h-[52px] min-w-0 flex-1 rounded-md bg-paper px-4 text-body text-ink shadow-well"
          style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
        />
        <PressButton disabled>{t("chat.send")}</PressButton>
      </div>
    </>
  );
}
