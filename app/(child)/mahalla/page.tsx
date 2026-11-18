// /mahalla заменён экранами /home и /house (docs/design/v3/README.md): старые ссылки и закладки ведут на /home.
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/home");
}
