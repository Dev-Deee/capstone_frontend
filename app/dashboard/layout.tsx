"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  STUDENT: [
    { href: "/dashboard/student", label: "Attendance & Devices" },
    { href: "/dashboard/student/attendance", label: "Attendance History" },
    { href: "/dashboard/student/profile", label: "My Profile" },
    { href: "/dashboard/student/assignments", label: "Assignments" },
  ],
  FACILITATOR: [
    { href: "/dashboard/facilitator", label: "Overview" },
    { href: "/dashboard/facilitator/assignments", label: "Assignments" },
    { href: "/dashboard/facilitator/attendance", label: "Attendance" },
  ],
  ADMIN: [
    { href: "/dashboard/admin/invite-codes", label: "Student Invite Codes" },
    { href: "/dashboard/admin/facilitator-assignments", label: "Facilitator Assignments" },
    { href: "/dashboard/admin/resumption", label: "Resumption Sessions" },
    { href: "/dashboard/admin/resumption/attendance", label: "Resumption Attendance" },
    { href: "/dashboard/admin/attendance", label: "Attendance Overview" },
  ],
  SUPER_ADMIN: [
    { href: "/dashboard/super-admin/institution", label: "Institution" },
    { href: "/dashboard/super-admin/cohorts", label: "Cohorts" },
    { href: "/dashboard/super-admin/subjects", label: "Subjects" },
    { href: "/dashboard/super-admin/invite-codes", label: "Student Invite Codes" },
    { href: "/dashboard/super-admin/admin-roles", label: "Admin Roles" },
    { href: "/dashboard/super-admin/staff-invites", label: "Staff Invites" },
    { href: "/dashboard/super-admin/users", label: "Users" },
    { href: "/dashboard/admin/invite-codes", label: "Student Invite Codes" },
    { href: "/dashboard/admin/facilitator-assignments", label: "Facilitator Assignments" },
    { href: "/dashboard/admin/resumption", label: "Resumption Sessions" },
    { href: "/dashboard/admin/resumption/attendance", label: "Resumption Attendance" },
    { href: "/dashboard/admin/attendance", label: "Attendance Overview" },
  ],
};

function highestRole(roles: string[]): string {
  if (roles.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("FACILITATOR")) return "FACILITATOR";
  return "STUDENT";
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { roles, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  }

  const role = highestRole(roles);
  const navItems = NAV_BY_ROLE[role] || [];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="text-gray-500 hover:text-gray-900"
          >
            <HamburgerIcon />
          </button>
          <span className="font-bold text-gray-900">Cadence</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{role.replace("_", " ")}</span>
          <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 z-50
          fixed md:static inset-y-0 left-0 transform transition-transform motion-reduce:transition-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-base">Cadence</span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="md:hidden text-gray-400 hover:text-gray-700"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm rounded-md mb-0.5 ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto pt-14 md:pt-0">
        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-end gap-4 px-6 py-3 border-b border-gray-200 bg-white">
          <span className="text-xs text-gray-400">{role.replace("_", " ")}</span>
          <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">
            Sign out
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
