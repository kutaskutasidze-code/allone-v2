// Redirect: /sales/team moved to /admin/team after the admin/sales partition.
import { redirect } from "next/navigation";
export default function Redirect() {
  redirect("/admin/team");
}
