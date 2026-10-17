"use client";

import TabbedPage from "@/components/TabbedPage";
import StudentInvitesSection from "@/components/sections/StudentInvitesSection";
import StaffInvitesSection from "@/components/sections/StaffInvitesSection";

export default function InvitesPage() {
  return (
    <TabbedPage
      title="Invites"
      description="Bring students and staff into your institution."
      tabs={[
        { id: "students", label: "Student Invite Codes", content: <StudentInvitesSection /> },
        { id: "staff", label: "Staff Invites", content: <StaffInvitesSection /> },
      ]}
    />
  );
}
