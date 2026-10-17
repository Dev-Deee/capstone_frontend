import { redirect } from "next/navigation";

// Merged into /dashboard/super-admin/cohorts?tab=subjects — kept so old links and bookmarks still work.
export default function Redirect() {
  redirect("/dashboard/super-admin/cohorts?tab=subjects");
}
