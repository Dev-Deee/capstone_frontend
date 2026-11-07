"use client";

import CourseManager from "@/components/courses/CourseManager";

export default function CoursesPage() {
  return <CourseManager role="FACILITATOR" basePath="/dashboard/facilitator/courses" />;
}
