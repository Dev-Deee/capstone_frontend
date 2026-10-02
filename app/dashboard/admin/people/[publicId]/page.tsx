"use client";

import { useParams } from "next/navigation";
import UserProfile from "@/components/users/UserProfile";

export default function AdminPersonPage() {
  const { publicId } = useParams<{ publicId: string }>();
  return <UserProfile publicId={publicId} listHref="/dashboard/admin/people" listLabel="People" />;
}
