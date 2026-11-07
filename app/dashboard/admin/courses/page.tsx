"use client";

import CourseManager from "@/components/courses/CourseManager";

export default function CoursesPage() {
  return <CourseManager role="ADMIN" basePath="/dashboard/admin/courses" />;
}
