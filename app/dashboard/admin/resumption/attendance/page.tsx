import { redirect } from "next/navigation";

// Merged into /dashboard/admin/attendance?tab=history — kept so old links and bookmarks still work.
export default function Redirect() {
  redirect("/dashboard/admin/attendance?tab=history");
}
