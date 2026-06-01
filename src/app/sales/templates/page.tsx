// Redirect: /sales/templates moved to /admin/templates after the admin/sales partition.
import { redirect } from "next/navigation";
export default function Redirect() {
  redirect("/admin/templates");
}
