"use client";
// Кризис: полный экран поверх всего, спокойно и без движения. Текст и номера только из view.crisis (сервер).
// Общий для урока и «Научи Bobr»: одно поведение.
import { createPortal } from "react-dom";
import { AiBadge } from "@/components/child/AiBadge";
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";

export function CrisisOverlay({ crisis, onLeave }: { crisis: { text: string; numbers: string[] }; onLeave: () => void }) {
  const { t } = useT();
  // портал: предок с transform превратил бы fixed в «внутри предка», и экран кризиса не закрыл бы окно
  return createPortal(
    <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-sand p-6 text-center text-ink">
      <AiBadge />
      <p className="max-w-md text-title">{crisis.text}</p>
      <p className="text-title font-bold">{t("lesson.crisis.call")} {crisis.numbers.join(", ")}</p>
      <PressButton onClick={onLeave}>{t("lesson.crisis.back")}</PressButton>
    </div>,
    document.body,
  );
}
