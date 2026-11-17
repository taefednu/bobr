"use client";
import { useEffect, useSyncExternalStore } from "react";
import uz from "../i18n/uz.json";
import ru from "../i18n/ru.json";

export type Lang = "uz" | "ru";
export type Key = Exclude<keyof typeof uz, "_todo">;
const DICT: Record<Lang, Record<string, string>> = { uz, ru };
const KEY = "bobr:lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    return localStorage.getItem(KEY) === "ru" ? "ru" : "uz";
  } catch {
    return "uz";
  }
}

export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
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

/** Сервер и гидрация — uz, реальный язык приходит следующим рендером (как useReducedMotionSafe). */
export function useLang(): Lang {
  const lang = useSyncExternalStore(subscribe, read, () => "uz");
  useEffect(() => {
    document.documentElement.lang = lang; // экранные читалки и переносы — по реальному языку
  }, [lang]);
  return lang;
}

export function useT() {
  const lang = useLang();
  return { lang, t: (k: Key) => DICT[lang][k] };
}
