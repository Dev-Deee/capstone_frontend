"use client";

import { useAuth } from "@/lib/auth-context";
import TabbedPage from "@/components/TabbedPage";
import Inbox from "@/components/messages/Inbox";
import Announcements from "@/components/messages/Announcements";

// Direct messages and cohort announcements, for every institution role.
// Staff post announcements here; students read them.
export default function MessagesPage() {
  const { roles } = useAuth();
  const staff = roles.some((r) => r === "FACILITATOR" || r === "ADMIN" || r === "SUPER_ADMIN");

  return (
    <TabbedPage
      title="Messages"
      description={staff
        ? "Talk one-to-one with students and colleagues, and post announcements to your cohorts."
        : "Talk one-to-one with your facilitators and admins, and read announcements for your cohort."}
      tabs={[
        { id: "messages", label: "Messages", content: <Inbox /> },
        { id: "announcements", label: "Announcements", content: <Announcements mode={staff ? "staff" : "student"} /> },
      ]}
    />
  );
}
