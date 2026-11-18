"use client";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMotion } from "@/lib/motion";

/** Карточка (DESIGN.md §5): paper, ink-контур, shadow-rest, без выступа. Появляется с appearFromScale. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { transitions, targets } = useMotion();
  return (
    <motion.div
      className={`rounded-lg bg-paper p-6 shadow-rest ${className}`}
      style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
      initial={{ opacity: 0, scale: targets.appearFromScale }}
      animate={{ opacity: 1, scale: 1, transition: transitions.appear }}
    >
      {children}
    </motion.div>
  );
}
