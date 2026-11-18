"use client";
// Выбор собеседника: две карточки-вкладки с портретами. Активная приподнята на ink-выступе, как нажатая клавиша наоборот.
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { PARTNERS, type Partner } from "./model";
import { Portrait } from "./Portrait";

export function Switch({ who, onWho }: { who: Partner; onWho: (w: Partner) => void }) {
  const { t } = useT();
  const { transitions } = useMotion();
  return (
    <div role="tablist" aria-label={t("chat.switch")} className="grid grid-cols-2 gap-3 md:grid-cols-1">
      {PARTNERS.map((p) => {
        const active = p === who;
        return (
          <motion.button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onWho(p)}
            whileTap={{ y: 2 }}
            transition={transitions.press}
            className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 md:min-h-14 md:gap-3 md:px-3 md:py-2 text-left ${active ? "bg-paper" : "bg-clay-100"}`}
            style={{
              border: `var(--stroke-ink) solid ${active ? "var(--color-ink)" : "var(--color-ink-muted)"}`,
              boxShadow: active ? "0 4px 0 var(--color-ink), var(--shadow-clay)" : "var(--shadow-well)",
              marginBottom: 4,
            }}
          >
            <Portrait who={p} size={36} />
            <span className="min-w-0">
              <span className="block font-display text-label font-semibold leading-tight">{t(`char.${p}`)}</span>
              <span className="hidden text-label font-normal text-ink-muted md:block">{t(`chat.role.${p}`)}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
