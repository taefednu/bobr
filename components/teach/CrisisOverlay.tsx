"use client";
// Кризис: полный экран поверх всего, спокойно и без движения. Текст и номера только из view.crisis (сервер).
// Вид v3, как в чате; только «Научи Bobr» его использует.
import { createPortal } from "react-dom";
import { AiBadge } from "@/components/child/AiBadge";
import { useT } from "@/lib/i18n";

export function CrisisOverlay({ crisis, onLeave }: { crisis: { text: string; numbers: string[] }; onLeave: () => void }) {
  const { t } = useT();
  // портал: предок с transform превратил бы fixed в «внутри предка», и экран кризиса не закрыл бы окно
  return createPortal(
    <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: "var(--v3-bg)", color: "var(--v3-ink)" }}>
      <AiBadge />
      <p className="v3-type-banner max-w-md">{crisis.text}</p>
      <p className="v3-type-card">{t("lesson.crisis.call")} {crisis.numbers.join(", ")}</p>
      <button type="button" onClick={onLeave} className="v3-type-label min-h-12 cursor-pointer rounded-full px-7 transition-transform duration-100 active:scale-95 motion-reduce:transition-none"
        style={{ background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" }}>
        {t("lesson.crisis.back")}
      </button>
    </div>,
    document.body,
  );
}
