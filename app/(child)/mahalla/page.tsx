"use client";
import { useRouter } from "next/navigation";
import { MahallaView } from "@/components/mahalla/MahallaView";
import { useT } from "@/lib/i18n";
import { stubMahalla } from "@/lib/ui/demo-data";

const DEMO_NOW = Date.parse("2026-11-18T12:00:00Z");

export default function Page() {
  const { lang } = useT();
  const router = useRouter();
  // TODO(core): mahalla:view, mahalla:startLesson({token, topic})
  return <MahallaView view={stubMahalla(DEMO_NOW, lang)} onStart={() => router.push("/lesson")} />;
}
