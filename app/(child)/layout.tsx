import type { ReactNode } from "react";
import { Shell } from "@/components/skeleton/Shell";

export default function ChildLayout({ children }: { children: ReactNode }) {
  return <Shell badge>{children}</Shell>;
}
