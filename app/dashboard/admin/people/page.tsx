"use client";

import TabbedPage from "@/components/TabbedPage";
import UsersSection from "@/components/sections/UsersSection";
import StudentInvitesSection from "@/components/sections/StudentInvitesSection";
import FacilitatorAssignmentsSection from "@/components/sections/FacilitatorAssignmentsSection";

export default function AdminPeoplePage() {
  return (
    <TabbedPage
      title="People"
      description="Manage accounts, invite students and assign facilitators to their cohorts."
      tabs={[
        { id: "users", label: "Users", content: <UsersSection detailHref={(id) => `/dashboard/admin/people/${id}`} /> },
        { id: "invites", label: "Student Invites", content: <StudentInvitesSection /> },
        { id: "facilitators", label: "Facilitator Assignments", content: <FacilitatorAssignmentsSection /> },
      ]}
    />
  );
}
