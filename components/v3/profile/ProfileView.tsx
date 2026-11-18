"use client";
// Экран /profile по эталону 4-profile.png (docs/design/v3/measure/profile.json). Живая страница и /dev/v3/profile рендерят этот компонент.
// Имя ребёнка только показывается здесь: ни в логи, ни в запросы (tests/displayNameGuard.test.ts).
import { useMutation } from "convex/react";
import Image from "next/image";
import { useCallback, useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { IconChevron, V3Card, V3Screen, V3Sheet } from "@/components/v3";
import { useT, type Key, type Lang } from "@/lib/i18n";
import { useToken } from "@/lib/ui/session";
import { useSetLang } from "@/lib/ui/useSetLang";
import { IconCheck, IconGlobe, IconPeople, IconSound, IconTarget } from "./icons";

export type Goal = "test_soon" | "improve" | "just_practice";
export type ProfileData = {
  name: string | null;
  grade: number | null;
  lang: Lang;
  goal: Goal | null;
  topics: { done: number; total: number };
  taught: number;
};

const GOALS: Goal[] = ["test_soon", "improve", "just_practice"];
const LANGS: Lang[] = ["uz", "ru"];

// Круги иконок строк: токены --v3-ic-* (globals.css); значок на «Звуке» на бирюзе, как на эталоне.
const ICON_TONE = {
  lang: { bg: "var(--v3-ic-lang-bg)", fg: "var(--v3-ic-lang-fg)" },
  sound: { bg: "var(--v3-ic-sound-bg)", fg: "var(--v3-on-teal)" },
  goal: { bg: "var(--v3-ic-goal-bg)", fg: "var(--v3-ic-goal-fg)" },
  parents: { bg: "var(--v3-ic-parents-bg)", fg: "var(--v3-ic-parents-fg)" },
};

// Звук: локальная настройка. Сервер и гидрация — «включён», реальное значение читается следующим рендером.
const SOUND_KEY = "bobr:sound";
const soundListeners = new Set<() => void>();
const readSound = () => {
  try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; }
};
function useSound(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(
    (cb) => { soundListeners.add(cb); window.addEventListener("storage", cb); return () => { soundListeners.delete(cb); window.removeEventListener("storage", cb); }; },
    readSound,
    () => true,
  );
  const set = useCallback((v: boolean) => {
    try { localStorage.setItem(SOUND_KEY, v ? "on" : "off"); } catch {}
    soundListeners.forEach((f) => f());
  }, []);
  return [on, set];
}

/** «2 темы», «5 тем»: форма по правилам ru, в uz форма одна. */
function taughtKey(n: number, lang: Lang): Key {
  if (lang === "uz") return "profile.stat.taughtOne";
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "profile.stat.taughtOne";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "profile.stat.taughtFew";
  return "profile.stat.taughtMany";
}

const fill = (s: string, v: Record<string, number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

function Row({ ref_, tone, icon, label, value, onClick, last, children }: {
  ref_: string; tone: keyof typeof ICON_TONE; icon: ReactNode; label: string; value?: string; onClick?: () => void; last?: boolean; children?: ReactNode;
}) {
  const inner = (
    <>
      <span data-ref={`rowIcon${ref_.slice(3)}`} className="flex size-[39px] shrink-0 items-center justify-center rounded-full" style={{ background: ICON_TONE[tone].bg, color: ICON_TONE[tone].fg }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-[17px] leading-5 font-bold">{label}</span>
      {value && <span className="max-w-[55%] text-right text-[16px] leading-5 font-medium" style={{ color: "var(--v3-ink-soft)" }}>{value}</span>}
      {children}
    </>
  );
  const style: CSSProperties = { height: 52, padding: "0 16px 0 19px", boxSizing: "border-box" };
  // Разделитель начинается от текста, а не от иконки: рисуем его отдельным слоем через маску-градиент.
  const cls = "flex w-full items-center gap-4 text-left transition-transform duration-100 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";
  const sep = last ? null : <span aria-hidden className="pointer-events-none absolute right-4 bottom-0 left-[74px] h-px" style={{ background: "var(--v3-divider)" }} />;
  return onClick ? (
    <button type="button" data-ref={ref_} onClick={onClick} className={`${cls} relative cursor-pointer`} style={style}>{inner}{sep}</button>
  ) : (
    <div data-ref={ref_} className={`${cls} relative`} style={style}>{inner}{sep}</div>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <V3Card as="button" type="button" tone="settings" radius="stat" aria-pressed={on} onClick={onClick}
      className="v3-type-label flex min-h-14 w-full cursor-pointer transition-transform duration-100 active:scale-[0.98] motion-reduce:active:scale-100 items-center justify-between gap-3 px-5 py-3 text-left"
      style={on ? { outline: "2px solid var(--v3-teal-strong)", outlineOffset: -2 } : undefined}>
      <span className="min-w-0">{children}</span>
      {on && <span style={{ color: "var(--v3-teal-strong)" }}><IconCheck /></span>}
    </V3Card>
  );
}

export function ProfileView({ data }: { data: ProfileData }) {
  const { t, lang } = useT();
  const token = useToken();
  const setLang = useSetLang();
  const saveGoal = useMutation(api.goal.set);
  const [sound, setSound] = useSound();
  const [sheet, setSheet] = useState<null | "lang" | "goal" | "parents">(null);
  const [pick, setPick] = useState<Goal | null>(null); // выбранная цель видна сразу, пока сервер не подтвердил
  const [failed, setFailed] = useState(false);
  const uzFit = lang === "uz" ? "text-[18px]" : ""; // uz длиннее: значения статистики на шаг мельче, чтобы не расти в три строки
  const goal = pick ?? data.goal;
  useEffect(() => { if (pick && data.goal === pick) setPick(null); }, [data.goal, pick]);

  async function chooseGoal(g: Goal) {
    setFailed(false);
    const before = pick;
    setPick(g);
    if (!token) return;
    try {
      await saveGoal({ token, goal: g });
      setSheet(null);
    } catch {
      setPick(before);
      setFailed(true);
    }
  }

  return (
    <V3Screen tab="profile">
      <h1 data-ref="title" className="mx-auto mt-[54px] w-fit min-w-[156px] text-center text-[32px] leading-7 font-extrabold">{t("profile.title")}</h1>
      <div data-ref="avatar" className="relative mx-auto mt-[19px] size-[152px] shrink-0 overflow-hidden rounded-full" style={{ background: "var(--v3-avatar)" }}>
        <Image src="/v3/avatar-bobr.webp" alt="" fill sizes="152px" priority className="object-cover" />
      </div>
      <p data-ref="name" className="mx-auto mt-[9px] h-[29px] w-fit min-w-[200px] text-center max-w-full truncate text-[30px] leading-[29px] font-extrabold">{data.name ?? t("profile.noName")}</p>
      <p data-ref="grade" className="mx-auto mt-[9px] h-4 w-fit min-w-[100px] text-center text-[17px] leading-4 font-medium" style={{ color: "var(--v3-ink-soft)" }}>
        {data.grade !== null ? fill(t("profile.grade"), { n: data.grade }) : null}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <V3Card tone="peach" radius="stat" data-ref="stat1" className="flex min-h-[90px] items-center gap-3 px-3 py-3">
          <Image src="/v3/stat-fraction.webp" alt="" width={48} height={48} className="shrink-0" />
          <div className="min-w-0">
            <p className="v3-type-caption" style={{ color: "var(--v3-ink-soft)" }}>{t("profile.stat.topics")}</p>
            <p className={`v3-type-card ${uzFit}`}>{fill(t("profile.stat.topicsValue"), data.topics)}</p>
          </div>
        </V3Card>
        <V3Card tone="peach" radius="stat" data-ref="stat2" className="flex min-h-[90px] items-center gap-1 px-2 py-3">
          <Image src="/v3/stat-bird.webp" alt="" width={52} height={52} className="shrink-0" />
          <div className="min-w-0">
            <p className="v3-type-caption text-[14px]" style={{ color: "var(--v3-ink-soft)" }}>{t("profile.stat.taught")}</p>
            <p className={`v3-type-card ${uzFit}`}>{fill(t(taughtKey(data.taught, lang)), { n: data.taught })}</p>
          </div>
        </V3Card>
      </div>

      <V3Card tone="settings" radius="stat" data-ref="settings" className="mt-3 flex flex-col" style={{ padding: "6.5px 0 7.5px" }}>
        <Row ref_="row1" tone="lang" icon={<IconGlobe />} label={t("profile.row.lang")} value={t(`lang.${lang}`)} onClick={() => setSheet("lang")}>
          <IconChevron style={{ color: "var(--v3-ink-soft)" }} />
        </Row>
        <Row ref_="row2" tone="sound" icon={<IconSound />} label={t("profile.row.sound")}>
          <button type="button" role="switch" aria-checked={sound} aria-label={t("profile.row.sound")} data-ref="toggle" onClick={() => setSound(!sound)}
            className="relative h-[30px] w-[53px] shrink-0 cursor-pointer rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none"
            style={{ background: sound ? "var(--v3-teal-strong)" : "var(--v3-circle)", boxShadow: "var(--v3-shadow-track)" }}>
            <span className="absolute top-[3px] left-[3px] size-6 rounded-full transition-transform duration-150 ease-out motion-reduce:transition-none" style={{ transform: sound ? "translateX(23px)" : "none", background: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-knob)" }} />
          </button>
        </Row>
        <Row ref_="row3" tone="goal" icon={<IconTarget />} label={t("profile.row.goal")} value={t(goal ? `profile.goal.${goal}` : "profile.goal.none")} onClick={() => { setFailed(false); setSheet("goal"); }}>
          <IconChevron style={{ color: "var(--v3-ink-soft)" }} />
        </Row>
        <Row ref_="row4" tone="parents" icon={<IconPeople />} label={t("profile.row.parents")} onClick={() => setSheet("parents")} last>
          <IconChevron style={{ color: "var(--v3-ink-soft)" }} />
        </Row>
      </V3Card>

      <V3Card tone="note" radius="stat" data-ref="note" className="mt-[11px] flex h-[82px] items-center gap-3 pr-5 pl-3">
        <Image src="/v3/note-duo.webp" alt="" width={130} height={70} className="shrink-0" />
        <p className="v3-type-label min-w-0 flex-1 text-[18px] leading-6">{t("profile.note")}</p>
      </V3Card>

      <V3Sheet open={sheet === "lang"} onClose={() => setSheet(null)} title={t("profile.sheet.lang")}>
        {LANGS.map((l) => (
          <Choice key={l} on={lang === l} onClick={() => { void setLang(l); setSheet(null); }}>{t(`lang.${l}`)}</Choice>
        ))}
      </V3Sheet>
      <V3Sheet open={sheet === "goal"} onClose={() => setSheet(null)} title={t("profile.sheet.goal")}>
        {GOALS.map((g) => (
          <Choice key={g} on={goal === g} onClick={() => void chooseGoal(g)}>{t(`profile.goal.${g}`)}</Choice>
        ))}
        {failed && <p role="alert" className="v3-type-caption" style={{ color: "var(--v3-ink-soft)" }}>{t("profile.error")}</p>}
      </V3Sheet>
      <V3Sheet open={sheet === "parents"} onClose={() => setSheet(null)} title={t("profile.sheet.parents")}>
        <p className="v3-type-caption pb-2 text-[16px] leading-6">{t("profile.sheet.parentsBody")}</p>
      </V3Sheet>
    </V3Screen>
  );
}
