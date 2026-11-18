// Страница сверки /dev/v3/house с эталоном 2-house.png. В production 404.
import { notFound } from "next/navigation";
import { Demo } from "./demo";

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Demo />;
}
