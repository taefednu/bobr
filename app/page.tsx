"use client";
// Вход ребёнка: есть токен — по state на свой экран; нет — демо-сессия (session:startDemo) и дальше то же.
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ChildShell } from "@/components/child/ChildShell";
import { CharacterSays } from "@/components/child/CharacterSays";
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";
import { clearToken, routeForState, setToken, storedLang, useChildSession } from "@/lib/ui/session";

export default function Home() {
  const { t } = useT();
  const router = useRouter();
  const startDemo = useMutation(api.session.startDemo);
  const { token, me } = useChildSession();
  const starting = useRef(false); // двойной эффект dev-режима и перерисовки: стартуем один раз
  const [failed, setFailed] = useState(false);

  async function begin() {
    if (starting.current) return;
    starting.current = true;
    setFailed(false);
    try {
      setToken((await startDemo({ lang: storedLang() })).token);
    } catch {
      starting.current = false;
      setFailed(true);
    }
  }

  useEffect(() => {
    if (token === null && !failed) void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, failed]);

  useEffect(() => {
    if (me === null) {
      starting.current = false;
      clearToken(); // токен не признан: начинаем заново
    } else if (me) router.replace(routeForState(me.state));
  }, [me, router]);

  return (
    <ChildShell>
      <div className="flex flex-col gap-6 sm:pt-[8vh]">
        {failed ? (
          <CharacterSays who="bobr"><p role="alert">{t("lesson.error")}</p></CharacterSays>
        ) : (
          <CharacterSays who="bobr" thinking />
        )}
        {failed && (
          <div>
            <PressButton onClick={() => void begin()}>{t("entry.retry")}</PressButton>
          </div>
        )}
      </div>
    </ChildShell>
  );
}
