"use client";

import { useParams } from "next/navigation";
import AssignmentReview from "@/components/review/AssignmentReview";

// A SUPER_ADMIN reviews any assignment in their institution with the same
// screen facilitators use; the API allows the owning facilitator or a SUPER_ADMIN.
export default function SuperAdminReviewAssignmentPage() {
  const { publicId } = useParams<{ publicId: string }>();
  return <AssignmentReview assignmentPublicId={publicId} backHref="/dashboard/super-admin/assignments" />;
}
