"use client";

import TabbedPage from "@/components/TabbedPage";
import UsersSection from "@/components/sections/UsersSection";
import AdminRolesSection from "@/components/sections/AdminRolesSection";

export default function UsersAndRolesPage() {
  return (
    <TabbedPage
      title="Users & Roles"
      tabs={[
        { id: "users", label: "Users", content: <UsersSection /> },
        { id: "roles", label: "Admin Roles", content: <AdminRolesSection /> },
      ]}
    />
  );
}
