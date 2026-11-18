"use client";
// Раскрытие ИИ и согласие. Единственное место до профиля, где ребёнок читает, что Bobr и Ustoz не люди.
// Текст consent.body целиком, обычным размером чата (18 px). Язык выбирается здесь: шапки с переключателем нет.
import { V3Card } from "@/components/v3";
import { Cta, Note, OnboardScreen, Rise } from "@/components/v3/onboarding/parts";
import { useT, type Lang } from "@/lib/i18n";
import { Alive } from "@/components/v3/motion";
import { useSetLang } from "@/lib/ui/useSetLang";

const LANGS: Lang[] = ["uz", "ru"];

function LangChoice() {
  const { t, lang } = useT();
  const setLang = useSetLang();
  return (
    <div role="group" aria-label={t("onboard.lang.label")} data-ref="lang" className="grid grid-cols-2 gap-3">
      {LANGS.map((l) => {
        const on = lang === l;
        return (
          <button key={l} type="button" aria-pressed={on} lang={l} onClick={() => void setLang(l)}
            className="v3-type-label flex h-12 cursor-pointer items-center justify-center rounded-full transition-transform duration-100 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            style={on
              ? { background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-title)", boxShadow: "var(--v3-shadow-round)" }
              : { background: "var(--v3-circle)", color: "var(--v3-ink)", boxShadow: "var(--v3-shadow-card)" }}>
            {t(`onboard.lang.${l}`)}
          </button>
        );
      })}
    </div>
  );
}

export function StartView({ busy, failed, onAccept }: { busy: boolean; failed: boolean; onAccept: () => void }) {
  const { t } = useT();
  return (
    <OnboardScreen cta={<Cta disabled={busy} onClick={onAccept}>{t("consent.accept")}</Cta>}>
      <Rise><LangChoice /></Rise>
      <Alive who="bobr" className="-mb-12 mt-1 w-[92%] max-w-[350px] self-center">
        <img src="/v3/hero-bobr-non.webp" alt="" aria-hidden width={300} height={200} draggable={false} data-ref="hero" className="block h-auto w-full select-none" />
      </Alive>
      <Rise delay={0.08}>
        <V3Card radius="banner" data-ref="card" className="flex flex-col gap-3 px-5 pt-6 pb-5">
          <h1 className="v3-type-banner">{t("consent.title")}</h1>
          <p className="v3-type-chat">{t("consent.body")}</p>
        </V3Card>
      </Rise>
      {failed && <Note>{t("lesson.error")}</Note>}
    </OnboardScreen>
  );
}
