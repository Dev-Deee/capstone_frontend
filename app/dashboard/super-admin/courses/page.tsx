"use client";

import CourseManager from "@/components/courses/CourseManager";

export default function CoursesPage() {
  return <CourseManager role="SUPER_ADMIN" basePath="/dashboard/super-admin/courses" />;
}
