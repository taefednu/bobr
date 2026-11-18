"use client";
// Смена языка: клиентский setLang (интерфейс) и profile:setLang (students.lang, от него язык реплик LLM) вместе.
// Сервер не ответил — откатываем клиентский язык, чтобы интерфейс и реплики не разъехались.
import { useMutation } from "convex/react";
import { useCallback, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { langSyncStep, setLang, storedChoice, useLang, type Lang } from "@/lib/i18n";
import { useChildSession, useToken } from "./session";

/** На каждом экране ребёнка держит вместе язык интерфейса и students.lang: ребёнок читает и получает ответы на одном языке. */
export function useLangSync() {
  const { token, me } = useChildSession();
  const ui = useLang();
  const save = useMutation(api.profile.setLang);
  const server = me?.lang;
  useEffect(() => {
    if (!token || !server) return;
    const step = langSyncStep(storedChoice(), server);
    if (step?.to === "ui") setLang(step.lang);
    else if (step) void save({ token, lang: step.lang }).catch(() => {});
  }, [token, server, ui, save]);
}

export function useSetLang() {
  const token = useToken();
  const cur = useLang();
  const save = useMutation(api.profile.setLang);
  return useCallback(
    async (lang: Lang) => {
      if (lang === cur) return;
      setLang(lang);
      if (!token) return; // до входа токена нет: язык только в браузере, сервер получит его при старте
      try {
        await save({ token, lang });
      } catch {
        setLang(cur);
      }
    },
    [token, cur, save],
  );
}
