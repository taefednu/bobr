"use client";
// Ссылка-код от бота: /c/{code} → linkCode:claim → токен → экран по state.
import { useMutation } from "convex/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CharacterSays } from "@/components/child/CharacterSays";
import { useT } from "@/lib/i18n";
import { setToken } from "@/lib/ui/session";

export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const { code } = useParams<{ code: string }>();
  const claim = useMutation(api.linkCode.claim);
  const once = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;
    claim({ code })
      .then(({ token }) => {
        setToken(token);
        router.replace("/"); // вход сам разведёт по state
      })
      .catch(() => setFailed(true));
  }, [claim, code, router]);

  return (
    <div className="flex flex-col gap-6 sm:pt-[8vh]">
      {failed ? (
        <CharacterSays who="bobr"><p role="alert">{t("entry.badCode")}</p></CharacterSays>
      ) : (
        <CharacterSays who="bobr" thinking />
      )}
      {failed && <Link href="/" className="font-bold underline">{t("entry.home")}</Link>}
    </div>
  );
}
