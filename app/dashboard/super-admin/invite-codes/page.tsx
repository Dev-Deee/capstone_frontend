import { redirect } from "next/navigation";

// Merged into /dashboard/super-admin/invites — kept so old links and bookmarks still work.
export default function Redirect() {
  redirect("/dashboard/super-admin/invites?tab=students");
}
