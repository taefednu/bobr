"use client";
// Сессия ребёнка: токен в localStorage, маршрут по state, охранник экрана. Токен нигде не логируется.
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { api } from "@/convex/_generated/api";

const KEY = "bobr:token";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
  } catch {}
  listeners.forEach((f) => f());
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((f) => f());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** undefined — гидрация (токен ещё не прочитан), null — токена нет. */
export function useToken(): string | null | undefined {
  return useSyncExternalStore<string | null | undefined>(subscribe, read, () => undefined);
}

/** Токен и session:me. me: undefined — грузится или нет токена, null — сервер токен не признал. */
export function useChildSession() {
  const token = useToken();
  const me = useQuery(api.session.me, token ? { token } : "skip");
  return { token, me };
}

/** Язык для startDemo: читаем storage напрямую, потому что useT на первом эффекте ещё отдаёт серверное "uz". */
export function storedLang(): "uz" | "ru" {
  try {
    return localStorage.getItem("bobr:lang") === "ru" ? "ru" : "uz";
  } catch {
    return "uz";
  }
}

export function routeForState(state: string): string {
  switch (state) {
    case "ONBOARD_CONSENT": return "/start";
    case "GOAL_SETUP": return "/goal";
    case "DIAGNOSE": return "/diagnose";
    case "PLAN": return "/plan";
    case "HOME": return "/home";
    case "TEACH_BOBR": case "JUDGING": case "BOBR_ATTEMPT": case "BOBR_QUESTION": return "/teach";
    default: return "/lesson"; // LESSON_SOLVE, TOPIC_DONE (из него на /home ведёт кнопка урока), CRISIS и всё урочное
  }
}

/** Ступень пути: 0 согласие, 1 цель, 2 диагностика, 3 план, 4 дом, чат и уроки. */
const EARLY = ["ONBOARD_CONSENT", "GOAL_SETUP", "DIAGNOSE", "PLAN"];
const stage = (state: string) => (EARLY.includes(state) ? EARLY.indexOf(state) : 4);

/** Экран открыт на ступенях min..max. Иначе: нет токена — на /, токен не признан — стереть и на /, прочее — на свой экран. */
export function useGuard(min: number, max: number) {
  const router = useRouter();
  const { token, me } = useChildSession();
  useEffect(() => {
    if (token === null) router.replace("/");
    else if (me === null) {
      clearToken();
      router.replace("/");
    } else if (me && (stage(me.state) < min || stage(me.state) > max)) router.replace(routeForState(me.state));
  }, [token, me, min, max, router]);
  const ready = !!token && !!me && stage(me.state) >= min && stage(me.state) <= max;
  return { token: ready ? token : null, me, ready };
}
