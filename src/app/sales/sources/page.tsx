// Redirect: /sales/sources moved to /admin/sources after the admin/sales partition.
import { redirect } from "next/navigation";
export default function Redirect() {
  redirect("/admin/sources");
}
