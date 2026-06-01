// Redirect: /sales/admin/aims moved to /admin/aims after the admin/sales partition.
import { redirect } from "next/navigation";
export default function Redirect() {
  redirect("/admin/aims");
}
