"use client";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { CharacterSays } from "@/components/child/CharacterSays";
import { HouseView } from "@/components/v3/house/HouseView";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
  const router = useRouter();
  const { token } = useGuard(4, 4);
  const data = useQuery(api.house.view, token ? { token } : "skip");
  const startLesson = useMutation(api.mahalla.startLesson);

  async function onStart(topic: string) {
    if (!token) return false;
    try {
      await startLesson({ token, topic });
      router.push("/lesson");
      return true;
    } catch {
      return false;
    }
  }

  if (!data) return <CharacterSays who="bobr" thinking />;
  return <HouseView data={data} onBack={() => router.push("/home")} onStart={onStart} />;
}
