import { redirect } from "next/navigation";

// Merged into a tabbed page — kept so old links and bookmarks still work.
export default function Redirect() {
  redirect("/dashboard/facilitator/classes?tab=attendance");
}
