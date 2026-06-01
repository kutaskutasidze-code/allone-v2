// Redirect: /sales/demos/references moved to /admin/references after the admin/sales partition.
import { redirect } from "next/navigation";
export default function Redirect() {
  redirect("/admin/references");
}
