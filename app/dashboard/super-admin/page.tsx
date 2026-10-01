import { redirect } from "next/navigation";

export default function SuperAdminIndex() {
  redirect("/dashboard/super-admin/cohorts");
}
