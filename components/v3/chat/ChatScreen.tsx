"use client";
// Экран /chat по эталону docs/design/v3/3-chat.png. Данные и действия приходят пропсами: page.tsx (живой Convex) и
// /dev/v3/chat (фикстуры) рендерят один компонент. Все состояния прежнего ChatView сохранены: пустой чат со стартерами,
// ожидание, optimistic, notice, остаток минут, закрытый чат. Кризис рисует ChildShell по me.state (один источник правды).
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LEFT_NOTE_MIN, type ChatData, type Notice, type Partner } from "@/components/chat/model";
import { IconArrowLeft, V3RoundButton, V3Screen } from "@/components/v3";
import { Alive } from "@/components/v3/motion";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { Avatar, V3Bubble, V3MessageRow, V3Typing } from "./Bubbles";
import { V3ClosedCard } from "./ClosedCard";
import { V3Composer } from "./Composer";

type Props = {
  who: Partner;
  data: ChatData | null | undefined;
  optimistic: string | null;
  pending: boolean;
  notice: Notice | null;
  onSend: (text: string) => void;
  onLeave: () => void;
  onBack: () => void;
  /** Только для /dev/v3/chat/states: черновик в поле (счётчик знаков). */
  draft?: string;
};

const STARTERS = [1, 2, 3] as const;
const CHIPS = ["hint", "example"] as const;
const CHIP_STYLE = { background: "var(--v3-circle)", boxShadow: "var(--v3-shadow-card)" } as const;

/** Высота видимой области: на телефоне клавиатура сжимает visualViewport, а не dvh, и поле уезжало бы под неё. */
function useVisibleHeight() {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const f = () => setH(vv.height);
    f();
    vv.addEventListener("resize", f);
    return () => vv.removeEventListener("resize", f);
  }, []);
  return h;
}

export function ChatScreen({ who, data, optimistic, pending, notice, onSend, onLeave, onBack, draft }: Props) {
  const { t } = useT();
  const { reduced, transitions } = useMotion();
  const scroller = useRef<HTMLUListElement>(null);
  const vh = useVisibleHeight();
  const messages = data?.messages ?? [];
  const empty = !!data && messages.length === 0 && !optimistic;
  const open = data ? data.access.open : true;
  const name = t(`char.${who}`);
  // fallback: сервер мог не записать реплику; тогда персонаж отвечает своей фразой
  const showNotice = notice === "fallback" ? messages.at(-1)?.role === "child" : !!notice;
  const left = data && open && data.access.minutesLeft > 0 && data.access.minutesLeft <= LEFT_NOTE_MIN ? data.access.minutesLeft : null;

  // всегда к последнему: новое сообщение, ожидание, плашка
  const tail = `${messages.length}|${optimistic ?? ""}|${pending}|${notice ?? ""}`;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: empty ? 0 : el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [tail, reduced, empty]);

  return (
    <V3Screen>
      <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: `calc(${vh ? `${vh}px` : "100dvh"} - env(safe-area-inset-bottom))` }}>
        <header className="flex shrink-0 items-center gap-[22px] pt-[37px]">
          <V3RoundButton data-ref="back" label={t("chatv3.back")} size={42} tone="cream" onClick={onBack}><IconArrowLeft size={20} /></V3RoundButton>
          <div className="flex min-w-0 flex-1 items-center gap-[13px]">
            <Alive who={who}><Avatar who={who} size={65} dataRef="avatar" /></Alive>
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <h1 data-ref="name" className="v3-type-name" style={{ lineHeight: "23px" }}>{name}</h1>
              {/* раскрытие ИИ: постоянная строка шапки, не прятать и не уменьшать */}
              <p data-ref="sub" className="font-medium text-[14px]" style={{ lineHeight: "14px", color: "var(--v3-ink-soft)" }}>{t(`chatv3.ai.${who}`)}</p>
            </div>
          </div>
        </header>

        <ul ref={scroller} aria-label={t("chat.log")} aria-live="polite" className="v3-scroll -mx-4 flex min-h-0 flex-1 list-none flex-col gap-[18px] overflow-y-auto overscroll-contain px-4 pb-4 pt-[30px]">
          {empty && (
            <>
              <V3Bubble role={who} text={t(`chat.greet.${who}`)} label={name} fresh />
              <li className="ml-[53px] flex flex-wrap gap-2 pt-1">
                {STARTERS.map((n, i) => (
                  <motion.button
                    key={`${who}${n}`}
                    type="button"
                    disabled={pending || !open}
                    onClick={() => onSend(t(`chat.start.${who}.${n}`))}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { ...transitions.appear, delay: 0.25 + i * 0.07 } }}
                    whileTap={{ scale: 0.97 }}
                    className="v3-type-caption min-h-11 cursor-pointer rounded-full px-[19px] py-2 text-left disabled:opacity-50"
                    style={CHIP_STYLE}
                  >
                    {t(`chat.start.${who}.${n}`)}
                  </motion.button>
                ))}
              </li>
            </>
          )}
          {messages.map((m, i) => {
            const k = i + 1;
            return <V3MessageRow key={m.id} m={m} label={m.role === "child" ? t("chat.you") : t(`char.${m.role}`)} refs={{ bubble: `msg${k}`, avatar: `msgAvatar${k}`, pie: m.visual ? "pie" : undefined }} />;
          })}
          {optimistic && <V3Bubble role="child" text={optimistic} label={t("chat.you")} fresh />}
          {pending && <V3Typing who={who} label={t("chat.typing").replace("{name}", name)} />}
          {showNotice && notice && (
            <V3Bubble role={who} text={notice === "fallback" ? t(`chat.notice.fallback.${who}`) : t(`chat.notice.${notice}`)} label={name} fresh />
          )}
        </ul>

        <div className="shrink-0 pb-5 pt-2">
          {open ? (
            <>
              {left !== null && <p className="v3-type-caption mb-2 tabular-nums" style={{ color: "var(--v3-ink-soft)" }}>{t("chat.left").replace("{n}", String(left))}</p>}
              {!empty && (
                <div className="mb-3.5 flex flex-wrap gap-[9px]">
                  {CHIPS.map((c, i) => (
                    <button key={c} data-ref={`chip${i + 1}`} type="button" disabled={pending} onClick={() => onSend(t(`chatv3.chip.${c}`))}
                      className="v3-type-label h-[39px] cursor-pointer rounded-full px-[19px] transition-transform duration-100 active:scale-95 disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100" style={CHIP_STYLE}>
                      {t(`chatv3.chip.${c}`)}
                    </button>
                  ))}
                </div>
              )}
              <V3Composer placeholder={t(`chatv3.input.${who}`)} pending={pending} onSend={onSend} defaultText={draft} />
            </>
          ) : (
            data && <V3ClosedCard access={data.access} onLeave={onLeave} />
          )}
        </div>
      </div>

    </V3Screen>
  );
}
