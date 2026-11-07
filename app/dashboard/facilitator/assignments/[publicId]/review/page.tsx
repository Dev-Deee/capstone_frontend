"use client";

import { useParams } from "next/navigation";
import AssignmentReview from "@/components/review/AssignmentReview";

export default function ReviewAssignmentPage() {
  const { publicId } = useParams<{ publicId: string }>();
  return <AssignmentReview assignmentPublicId={publicId} backHref="/dashboard/facilitator/classes?tab=assignments" />;
}
