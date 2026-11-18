import type { ReactNode } from "react";
import { ChildShell } from "@/components/child/ChildShell";

export default function ChildLayout({ children }: { children: ReactNode }) {
  return <ChildShell>{children}</ChildShell>;
}
