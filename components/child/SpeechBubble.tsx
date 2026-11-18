import type { ReactNode } from "react";

/** Реплика персонажа: paper, ink-контур, хвост к персонажу слева. aria-live — читалка озвучит новую реплику. */
export function SpeechBubble({ children }: { who?: "bobr" | "ustoz"; children: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="relative min-w-0 flex-1 rounded-lg bg-paper p-4 text-body text-ink shadow-rest"
      style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
    >
      <svg aria-hidden width="14" height="22" viewBox="0 0 14 22" className="absolute -left-[14px] top-5" style={{ overflow: "visible" }}>
        <path d="M14 0 L0 11 L14 22 Z" fill="var(--color-paper)" style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)", strokeLinejoin: "round" }} />
        <rect x="11" y="2" width="6" height="18" fill="var(--color-paper)" />
      </svg>
      {children}
    </div>
  );
}
