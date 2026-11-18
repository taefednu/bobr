// Страница сверки /dev/v3/profile с эталоном 4-profile.png. В production 404.
import { notFound } from "next/navigation";
import { Demo } from "./demo";

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Demo />;
}
