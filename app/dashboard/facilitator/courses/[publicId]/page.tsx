"use client";

import { useParams } from "next/navigation";
import CourseEditor from "@/components/courses/CourseEditor";

export default function CoursePage() {
  const { publicId } = useParams<{ publicId: string }>();
  return <CourseEditor publicId={publicId} role="FACILITATOR" listHref="/dashboard/facilitator/courses" />;
}
