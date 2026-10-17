"use client";

import TabbedPage from "@/components/TabbedPage";
import UsersSection from "@/components/sections/UsersSection";
import AdminRolesSection from "@/components/sections/AdminRolesSection";

export default function UsersAndRolesPage() {
  return (
    <TabbedPage
      title="Users & Roles"
      description="Everyone in your institution, and what each admin is allowed to do."
      tabs={[
        { id: "users", label: "Users", content: <UsersSection detailHref={(id) => `/dashboard/super-admin/users/${id}`} /> },
        { id: "roles", label: "Admin Roles", content: <AdminRolesSection /> },
      ]}
    />
  );
}
