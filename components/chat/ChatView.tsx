"use client";
import { createPortal } from "react-dom";
// Экран болталки: слева собеседник (на телефоне полоска сверху), справа переписка в одной рамке с полем ввода.
// Чистый компонент: данные и действия приходят пропсами (page.tsx — живой бэкенд, preview — образцы).
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { crisisMessage } from "@/lib/safety/crisis";
import { PressButton } from "@/components/ui/press-button";
import { AiBadge } from "@/components/child/AiBadge";
import { Bubble, MessageRow, TypingBubble } from "./Bubbles";
import { ClosedPanel } from "./ClosedPanel";
import { Composer } from "./Composer";
import { LEFT_NOTE_MIN, type ChatData, type Notice, type Partner } from "./model";
import { Portrait } from "./Portrait";
import { Stage } from "./Stage";
import { Switch } from "./Switch";

type Props = {
  who: Partner;
  onWho: (w: Partner) => void;
  data: ChatData | null | undefined;
  optimistic: string | null;
  pending: boolean;
  notice: Notice | null;
  crisis: boolean;
  onSend: (text: string) => void;
  onLeave: () => void;
};

const STARTERS = [1, 2, 3] as const;

export function ChatView({ who, onWho, data, optimistic, pending, notice, crisis, onSend, onLeave }: Props) {
  const { t, lang } = useT();
  const { reduced, transitions } = useMotion();
  const scroller = useRef<HTMLUListElement>(null);
  const messages = data?.messages ?? [];
  const replies = messages.filter((m) => m.role !== "child").length;
  const empty = !!data && messages.length === 0 && !optimistic;
  const open = data ? data.access.open : true;
  const name = t(`char.${who}`);
  // fallback: сервер мог не записать реплику; тогда персонаж отвечает своей фразой
  const showNotice = notice === "fallback" ? messages.at(-1)?.role === "child" : !!notice;

  // всегда к последнему: новое сообщение, ожидание, плашка
  const tail = `${messages.length}|${optimistic ?? ""}|${pending}|${notice ?? ""}`;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: empty ? 0 : el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [tail, reduced, empty]);

  return (
    <>
      <div
        className="relative flex flex-col gap-3 md:left-1/2 md:w-[min(72rem,calc(100vw-2rem))] md:-translate-x-1/2 md:grid md:grid-cols-[19rem_minmax(0,1fr)] md:gap-6"
        // шапка (имя, плашка ИИ, отступы) ≈ 8.5rem, нижний навбар и его отступ; поле ввода прижато к низу рамки
        style={{ height: "calc(100dvh - 9.5rem - var(--bottom-nav-h) - 1.5rem - env(safe-area-inset-bottom))", minHeight: 420 }}
      >
        <aside className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-3 gap-y-2 md:flex md:min-h-0 md:flex-col md:items-stretch md:gap-4">
          <div className="col-start-2 row-start-2 md:order-1"><Switch who={who} onWho={onWho} /></div>
          <div
            className="contents md:order-2 md:flex md:min-h-0 md:flex-1 md:flex-col md:items-center md:justify-end md:rounded-xl md:bg-[var(--stage)] md:px-4 md:pb-5 md:pt-6 md:shadow-rest md:[border:var(--stroke-ink)_solid_var(--color-ink)]"
            style={{ ["--stage" as string]: who === "bobr" ? "var(--color-bubble-bobr)" : "var(--color-bubble-ustoz)" }}
          >
            <div className="col-start-1 row-span-2 row-start-1">
              <Stage who={who} pose={data?.pose ?? null} turn={replies} thinking={pending} />
            </div>
            <div className="col-start-2 row-start-1 min-w-0 md:text-center">
              <p className="font-display text-title font-bold leading-tight">{name}</p>
              <p className="text-label text-ink-muted" aria-live="polite">
                {pending ? t("chat.typing").replace("{name}", name) : t(`chat.role.${who}`)}
              </p>
            </div>
          </div>
        </aside>

        <section
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-sand shadow-rest"
          style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
        >
          <ul
            ref={scroller}
            aria-label={t("chat.log")}
            className="flex min-h-0 flex-1 list-none flex-col gap-3 overflow-y-auto overscroll-contain bg-clay-100/40 p-4"
          >
            {empty && (
              <>
                <Bubble role={who} text={t(`chat.greet.${who}`)} label={name} fresh />
                <li className="flex flex-col items-end gap-2 pt-2">
                  {STARTERS.map((n, i) => (
                    <motion.button
                      key={`${who}${n}`}
                      type="button"
                      disabled={pending || !open}
                      onClick={() => onSend(t(`chat.start.${who}.${n}`))}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { ...transitions.appear, delay: 0.25 + i * 0.07 } }}
                      whileTap={{ y: 2 }}
                      className="min-h-11 max-w-[92%] cursor-pointer rounded-lg rounded-br-sm bg-paper px-4 py-2 text-right text-body text-ink shadow-rest"
                      style={{ border: "var(--stroke-ink) solid var(--color-lazuli)" }}
                    >
                      {t(`chat.start.${who}.${n}`)}
                    </motion.button>
                  ))}
                </li>
              </>
            )}
            {messages.map((m) => (
              <MessageRow key={m.id} m={m} label={m.role === "child" ? t("chat.you") : t(`char.${m.role}`)} />
            ))}
            {optimistic && <Bubble role="child" text={optimistic} label={t("chat.you")} fresh />}
            {pending && <TypingBubble who={who} label={t("chat.typing").replace("{name}", name)} />}
            {showNotice && notice && (
              <Bubble
                role={who}
                text={notice === "fallback" ? t(`chat.notice.fallback.${who}`) : t(`chat.notice.${notice}`)}
                label={name}
                fresh
              />
            )}
          </ul>

          {open ? (
            <>
              {data && data.access.minutesLeft > 0 && data.access.minutesLeft <= LEFT_NOTE_MIN && (
                <p className="bg-paper px-4 pt-2 text-label text-ink-muted tabular" style={{ borderTop: "var(--stroke-ink-thin) solid var(--color-clay-100)" }}>
                  {t("chat.left").replace("{n}", String(data.access.minutesLeft))}
                </p>
              )}
              <Composer pending={pending} onSend={onSend} />
            </>
          ) : (
            data && <ClosedPanel access={data.access} onLeave={onLeave} />
          )}
        </section>
      </div>

      {crisis && createPortal(
        // как в уроке: полный экран, спокойно, без движения; текст и номера из шаблона crisisMessage
        <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-sand p-6 text-center text-ink">
          <AiBadge />
          <Portrait who={who} size={72} />
          <p className="max-w-md text-title">{crisisMessage(lang).trustedAdultFirst}</p>
          <p className="text-title font-bold">{t("lesson.crisis.call")} {crisisMessage(lang).numbers.join(", ")}</p>
          <PressButton onClick={onLeave}>{t("chat.crisis.back")}</PressButton>
        </div>,
        document.body,
      )}
    </>
  );
}
