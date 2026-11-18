"use client";
// Вход экрана (E7): только opacity. Transform на этой обёртке сделал бы её containing block для
// `fixed`-потомков (CrisisOverlay), поэтому движения тут нет. Каркас и плашка ИИ снаружи и не анимируются.
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMotion } from "@/lib/motion";

export default function ChildTemplate({ children }: { children: ReactNode }) {
  const { reduced, transitions } = useMotion();
  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1, transition: transitions.pageIn }}
    >
      {children}
    </motion.div>
  );
}
