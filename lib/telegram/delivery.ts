// Чистая логика доставки outbox: тихие часы, лимит 1 несрочный в день, паузы и настройки родителя, планирование сводок.
// Время — Asia/Tashkent (UTC+5, без перехода на летнее). Кризис сюда не попадает: его не задерживает ничто.
import { houseState } from "../houses";
import type { TopicLevel } from "../types";

const HOUR = 3_600_000;
export const DAY_MS = 86_400_000;
export const TZ_OFFSET_MS = 5 * HOUR;
export const QUIET_FROM_HOUR = 21;
export const QUIET_TO_HOUR = 8;

export type Notifications = { taughtBobr: boolean; dailySummary: boolean; forgotten: boolean };
export type NonCrisisKind = "taught_bobr" | "daily_summary" | "forgotten";
export const NON_CRISIS_KINDS: NonCrisisKind[] = ["taught_bobr", "daily_summary", "forgotten"];
const SETTING: Record<NonCrisisKind, keyof Notifications> = { taught_bobr: "taughtBobr", daily_summary: "dailySummary", forgotten: "forgotten" };

export const tashkentHour = (now: number) => new Date(now + TZ_OFFSET_MS).getUTCHours();
/** 21:00 включительно … 08:00 не включительно. */
export const isQuietHour = (now: number) => { const h = tashkentHour(now); return h >= QUIET_FROM_HOUR || h < QUIET_TO_HOUR; };
export const tashkentDayStart = (now: number) => Math.floor((now + TZ_OFFSET_MS) / DAY_MS) * DAY_MS - TZ_OFFSET_MS;
export const tashkentDate = (now: number) => new Date(now + TZ_OFFSET_MS).toISOString().slice(0, 10);

export const kindEnabled = (n: Notifications | undefined, kind: NonCrisisKind) => n?.[SETTING[kind]] !== false;

type Row = { _id: string; parentId: string; kind: string; studentId?: string; createdAt: number };
type ParentPrefs = { pausedUntil?: number; notifications?: Notifications };

/** rows — неотправленные несрочные, старые первыми. Возвращает те, что можно слать сейчас, не больше limit.
 *  sentTodayParents — родители, которым уже ушло несрочное за сегодняшние сутки по Ташкенту.
 *  abuseStudents — дети с учтённым ABUSE_HOME: родителю ничего, ни сводок, ни «научил». */
export function selectDeliverable<R extends Row>(p: {
  rows: R[]; now: number; limit: number; sentTodayParents: Set<string>;
  parents: Map<string, ParentPrefs | undefined>; abuseStudents: Set<string>;
}): R[] {
  if (isQuietHour(p.now)) return [];
  const taken = new Set(p.sentTodayParents);
  const out: R[] = [];
  for (const r of p.rows) {
    if (out.length >= p.limit) break;
    if (r.kind === "crisis" || taken.has(r.parentId)) continue;
    const prefs = p.parents.get(r.parentId);
    if ((prefs?.pausedUntil ?? 0) > p.now || !kindEnabled(prefs?.notifications, r.kind as NonCrisisKind)) continue;
    if (r.studentId && p.abuseStudents.has(r.studentId)) continue;
    taken.add(r.parentId);
    out.push(r);
  }
  return out;
}

export type Digest = { kind: "daily_summary"; dedupeKey: string; solved: number; taught: number } | { kind: "forgotten"; dedupeKey: string; dimmed: number };

/** Что положить родителю про одного ребёнка. Одна сводка в день (ключ по дате), «забыл» не чаще раза в неделю;
 *  если есть сводка за день, «забыл» не создаётся. existingKeys — уже лежащие у этого родителя dedupeKey: повторный запуск ничего не дублирует. */
export function planDigest(p: {
  studentId: string; now: number; notifications?: Notifications; existingKeys: Set<string>;
  topics: { level: TopicLevel; solvedSelfAt?: number; taughtAt?: number }[];
}): Digest | null {
  const since = p.now - DAY_MS;
  const solved = p.topics.filter((t) => t.solvedSelfAt !== undefined && t.solvedSelfAt > since).length;
  const taught = p.topics.filter((t) => t.taughtAt !== undefined && t.taughtAt > since).length;
  if (solved + taught > 0) {
    const dedupeKey = `daily:${p.studentId}:${tashkentDate(p.now)}`;
    return kindEnabled(p.notifications, "daily_summary") && !p.existingKeys.has(dedupeKey) ? { kind: "daily_summary", dedupeKey, solved, taught } : null;
  }
  const dimmed = p.topics.filter((t) => houseState(t, p.now) === "dimmed").length;
  if (dimmed === 0) return null;
  const dedupeKey = `forgotten:${p.studentId}:${Math.floor((p.now + TZ_OFFSET_MS) / (7 * DAY_MS))}`;
  return kindEnabled(p.notifications, "forgotten") && !p.existingKeys.has(dedupeKey) ? { kind: "forgotten", dedupeKey, dimmed } : null;
}
