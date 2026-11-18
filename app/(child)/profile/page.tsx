"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CharacterSays } from "@/components/child/CharacterSays";
import { ProfileView } from "@/components/v3/profile/ProfileView";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
  const { token } = useGuard(4, 4);
  const data = useQuery(api.profile.view, token ? { token } : "skip");
  if (!data) return <CharacterSays who="bobr" thinking />;
  return <ProfileView data={data} />;
}
