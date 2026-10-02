"use client";

import { useParams } from "next/navigation";
import UserProfile from "@/components/users/UserProfile";

export default function SuperAdminUserPage() {
  const { publicId } = useParams<{ publicId: string }>();
  return <UserProfile publicId={publicId} listHref="/dashboard/super-admin/users" listLabel="Users & Roles" />;
}
