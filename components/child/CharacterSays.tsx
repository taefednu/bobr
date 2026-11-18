"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { BUBBLE_DELAY_S, THINKING_DOTS_DELAY_S, useMotion } from "@/lib/motion";
import { Character, type Emotion, type Who } from "./Character";
import { SpeechBubble, TypedText, typingSeconds } from "./SpeechBubble";

/** Текст узла: по нему меняется `beat`, когда реплика приходит JSX-ом, а не строкой. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (typeof node === "object" && "props" in node) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

type Props = {
  who: Who;
  /** Реплика строкой: печатается по словам (E4), персонаж говорит. Строковые children делают то же. */
  say?: string;
  /** Ждём ответ: персонаж качает головой, в облачке три точки (после THINKING_DOTS_DELAY_S), читалке — «X думает…».
   *  Реплика, если есть, остаётся невидимой и держит высоту. */
  thinking?: boolean;
  /** Смена значения — облачко хлопает заново (A10). */
  popKey?: string;
  /** Стойка и действие персонажа на новую реплику. */
  emotion?: Emotion;
  /** Свой повод для реакции персонажа; по умолчанию — текст реплики. */
  beat?: string;
  /** JSX после реплики или вместо неё. Строка тут — то же, что `say`. */
  children?: ReactNode;
};

/** Персонаж слева, реплика справа. Телефон: 104 px, десктоп: 144 px (CSS перекрывает размер коробки). */
export function CharacterSays({ who, say, thinking = false, popKey, emotion, beat, children }: Props) {
  const { t } = useT();
  const { reduced } = useMotion();
  const text = say ?? (typeof children === "string" ? children : undefined);
  const extra = say === undefined && typeof children === "string" ? null : children;

  // Точки не мигают на быстрой мутации; покачивание персонажа стартует сразу.
  const [dotsReady, setDotsReady] = useState(false);
  useEffect(() => {
    if (!thinking) return;
    const id = setTimeout(() => setDotsReady(true), THINKING_DOTS_DELAY_S * 1000);
    return () => {
      clearTimeout(id);
      setDotsReady(false);
    };
  }, [thinking]);

  // Персонаж говорит, пока печатается реплика.
  const [talking, setTalking] = useState(false);
  useEffect(() => {
    if (!text || thinking || reduced) return;
    const on = setTimeout(() => setTalking(true), BUBBLE_DELAY_S * 1000);
    const off = setTimeout(() => setTalking(false), typingSeconds(text) * 1000);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
      setTalking(false);
    };
  }, [text, thinking, reduced]);

  return (
    <div className="flex items-start gap-3">
      <Character
        who={who}
        size={104}
        className="sm:!size-36"
        lively
        thinking={thinking}
        talking={talking}
        emotion={emotion}
        beat={beat ?? [text, textOf(extra)].join("|")}
      />
      <SpeechBubble who={who} popKey={popKey} dots={thinking && dotsReady} status={thinking ? t(who === "bobr" ? "teach.thinking" : "lesson.thinking") : undefined}>
        {text !== undefined || extra ? (
          <>
            {text !== undefined && <p><TypedText key={text} text={text} /></p>}
            {extra}
          </>
        ) : undefined}
      </SpeechBubble>
    </div>
  );
}
