"use client";
// Вход экрана. Вкладки (/home, /house, /profile) въезжают сбоку по порядку таб-бара: вправо, если вкладка правее предыдущей,
// влево, если левее. Остальные переходы (урок, чат, цель) — только opacity.
// Transform на обёртке делает её containing block для `fixed`-потомков (CrisisOverlay), поэтому: кризис и шторки рисуются
// вне этой обёртки (CrisisGate в ChildShell, V3Sheet через портал), а когда анимация кончилась, framer снимает transform совсем.
// Фон и таб-бар стоят в ChildShell выше и не двигаются; overflow-x: clip на обёртке ChildShell не даёт сдвигу породить горизонтальную прокрутку.
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useMotion } from "@/lib/motion";
import { hasTabBar, tabIndex } from "@/components/v3/routes";

const SLIDE_PX = 28;
let prevPath: string | null = null; // путь предыдущего экрана: template пересоздаётся на каждом переходе

export default function ChildTemplate({ children }: { children: ReactNode }) {
  const { reduced, transitions } = useMotion();
  const path = usePathname();
  const from = useRef(prevPath); // значение на момент монтирования этого экрана
  useEffect(() => { prevPath = path; }, [path]);
  const dir =
    from.current && from.current !== path && hasTabBar(from.current) && hasTabBar(path)
      ? Math.sign(tabIndex(path) - tabIndex(from.current))
      : 0;
  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={reduced ? false : { opacity: 0, x: dir * SLIDE_PX }}
      animate={{ opacity: 1, x: 0, transition: { x: transitions.move, opacity: transitions.pageIn } }}
    >
      {children}
    </motion.div>
  );
}
