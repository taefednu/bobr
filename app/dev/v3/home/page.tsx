// Страница сверки /dev/v3/home с эталоном 1-home.png (docs/design/v3/PIXEL_QA.md). В production 404.
import { notFound } from "next/navigation";
import { Demo } from "./demo";

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Demo />;
}
