"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { IconClose } from "./icons";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Нижняя шторка v3. Фокус уходит внутрь и возвращается на кнопку-источник, Tab не выходит за шторку,
 * Esc и нажатие по фону закрывают, фон страницы не листается. Движение из lib/motion.ts (при reduced — без него, содержимое на месте).
 */
export function V3Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const { t } = useT();
  const { reduced, transitions } = useMotion();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const titleId = useId();
  useEffect(() => { close.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const from = document.activeElement as HTMLElement | null;
    const el = panel.current;
    (el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(FOCUSABLE) ?? el)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close.current(); return; }
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      from?.focus?.();
    };
  }, [open]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--v3-scrim)" }}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1, transition: transitions.pageIn }}
            exit={{ opacity: 0, transition: transitions.exit }}
            onClick={onClose}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-[var(--v3-col-max)]">
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="pointer-events-auto flex max-h-[85dvh] flex-col gap-4 overflow-y-auto px-5 pt-5 outline-none"
              style={{
                background: "var(--v3-card)",
                color: "var(--v3-ink)",
                borderRadius: "var(--v3-r-banner) var(--v3-r-banner) 0 0",
                boxShadow: "var(--v3-shadow-sheet)",
                paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
              }}
              initial={reduced ? false : { y: "100%" }}
              animate={{ y: 0, transition: transitions.panel }}
              exit={{ y: reduced ? 0 : "100%", transition: transitions.exit }}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id={titleId} className="v3-type-section min-w-0">{title}</h2>
                <button
                  type="button"
                  aria-label={t("nav.close")}
                  onClick={onClose}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full"
                  style={{ background: "var(--v3-circle)", boxShadow: "var(--v3-shadow-card)" }}
                >
                  <IconClose />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
