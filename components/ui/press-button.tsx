"use client";
// Единственная нажимаемая кнопка (DESIGN.md §4–5). Выступ — жёсткая ink-тень, считается из ОДНОГО
// MotionValue `y`: ledge = ledgePx − y. Низ выступа стоит на месте, кнопка «уходит в стол».
import { useSyncExternalStore, type ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { HOVER_MEDIA, TARGETS, useMotion } from "@/lib/motion";

type Props = {
  variant?: "primary" | "secondary";
  disabled?: boolean;
  /** Закрепляет статичный вид состояния — только для /dev/styleguide, чтобы снимок показал каждое. */
  demoState?: "hover" | "pressed" | "focus";
  onClick?: () => void;
  type?: "button" | "submit";
  /** На всю ширину колонки: варианты ответа и главное действие на телефоне. */
  fullWidth?: boolean;
  /** Выше обычной: в кнопке стоит дробь столбиком. */
  tall?: boolean;
  children: ReactNode;
};

const RING_GAP = "calc(var(--focus-offset) + var(--stroke-ink))"; // кольцо снаружи контура
const { ledgePx, pressDepthPx, hover } = TARGETS;

function subscribeHover(onChange: () => void) {
  const q = window.matchMedia(HOVER_MEDIA);
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
}

const FILL = {
  primary: "bg-lazuli text-paper hover:bg-lazuli-deep",
  secondary: "bg-paper text-ink",
} as const;

export function PressButton({ variant = "primary", disabled, demoState, onClick, type = "button", fullWidth, tall, children }: Props) {
  const { transitions } = useMotion();
  const canHover = useSyncExternalStore(subscribeHover, () => window.matchMedia(HOVER_MEDIA).matches, () => false);
  const pinned = demoState === "pressed" ? pressDepthPx : demoState === "hover" ? hover.lift : 0;
  const y = useMotionValue(pinned);
  const boxShadow = useTransform(
    y,
    (v) => `0 ${ledgePx - v}px 0 var(--color-ink), var(--shadow-clay)`,
  );
  // Мягкая тень под выступом тает по мере нажатия.
  const dropOpacity = useTransform(y, [hover.lift, pressDepthPx], [1, 0.3]);

  const live = !disabled && !demoState;
  const deepFill = variant === "primary" && demoState === "hover" ? "bg-lazuli-deep" : "";
  return (
    <span className={`group relative ${fullWidth ? "flex w-full" : "inline-flex w-fit shrink-0"}`} style={{ marginBottom: ledgePx }}>
      {/* Кольцо фокуса: в неподвижной обёртке, не на кнопке — иначе оно ездит вместе с нажатием. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute rounded-full group-has-[:focus-visible]:opacity-100 ${demoState === "focus" ? "opacity-100" : "opacity-0"}`}
        style={{ inset: `calc(${RING_GAP} * -1)`, bottom: `calc(${RING_GAP} * -1 - ${ledgePx}px)`, border: "var(--focus-ring)" }}
      />
      {!disabled && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: "var(--shadow-drop)", top: ledgePx, opacity: dropOpacity }}
        />
      )}
      <motion.button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`relative ${tall ? "h-[84px]" : "h-[52px]"} ${fullWidth ? "w-full" : "whitespace-nowrap"} rounded-full px-7 text-label font-semibold ${
          disabled ? "bg-clay-100 text-ink-muted" : `${FILL[variant]} ${deepFill} cursor-pointer`
        }`}
        style={{
          y,
          borderStyle: "solid",
          borderColor: disabled ? "var(--color-ink-muted)" : "var(--color-ink)",
          outline: "none",
          borderWidth: "var(--stroke-ink)",
          boxShadow: disabled ? "var(--shadow-clay)" : boxShadow,
        }}
        whileTap={live ? { y: pressDepthPx } : undefined}
        whileHover={live && canHover ? { y: hover.lift } : undefined}
        transition={transitions.press}
      >
        {children}
      </motion.button>
    </span>
  );
}
