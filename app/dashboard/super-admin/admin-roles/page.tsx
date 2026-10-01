import { redirect } from "next/navigation";

// Merged into /dashboard/super-admin/users?tab=roles — kept so old links and bookmarks still work.
export default function Redirect() {
  redirect("/dashboard/super-admin/users?tab=roles");
}
