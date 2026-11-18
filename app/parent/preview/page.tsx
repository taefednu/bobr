import { notFound } from "next/navigation";
import Preview from "./preview";

/** Presentation fixtures never bypass /parent authentication and are unavailable in production. */
export default function ParentPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Preview />;
}
