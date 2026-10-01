"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { userApi } from "@/lib/api";

type IconName = "home" | "book" | "settings" | "people" | "calendar" | "building" | "layers" | "mail" | "classes";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  STUDENT: [
    { href: "/dashboard/student", label: "Dashboard", icon: "home" },
    { href: "/dashboard/student/learning", label: "My Learning", icon: "book" },
    { href: "/dashboard/student/profile", label: "Account Settings", icon: "settings" },
  ],
  FACILITATOR: [
    { href: "/dashboard/facilitator", label: "Overview", icon: "home" },
    { href: "/dashboard/facilitator/classes", label: "My Classes", icon: "classes" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Home", icon: "home" },
    { href: "/dashboard/admin/people", label: "People", icon: "people" },
    { href: "/dashboard/admin/attendance", label: "Attendance", icon: "calendar" },
  ],
  SUPER_ADMIN: [
    { href: "/dashboard/super-admin", label: "Home", icon: "home" },
    { href: "/dashboard/super-admin/institution", label: "Institution", icon: "building" },
    { href: "/dashboard/super-admin/cohorts", label: "Cohorts & Subjects", icon: "layers" },
    { href: "/dashboard/super-admin/invites", label: "Invites", icon: "mail" },
    { href: "/dashboard/super-admin/users", label: "Users & Roles", icon: "people" },
    { href: "/dashboard/admin/attendance", label: "Attendance", icon: "calendar" },
  ],
};

// Where the logo takes each role — always their own home page.
const HOME_BY_ROLE: Record<string, string> = {
  STUDENT: "/dashboard/student",
  FACILITATOR: "/dashboard/facilitator",
  ADMIN: "/dashboard/admin",
  SUPER_ADMIN: "/dashboard/super-admin",
};

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  FACILITATOR: "Facilitator",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

function highestRole(roles: string[]): string {
  if (roles.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("FACILITATOR")) return "FACILITATOR";
  return "STUDENT";
}

// Stroke icons drawn to sit quietly beside nav labels.
const ICON_PATHS: Record<IconName, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.3A6.5 6.5 0 0 1 21.5 20" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /><path d="m9 15 2 2 4-4" /></>,
  building: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M2 21h20M8 7h4M8 11h4M8 15h4" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>,
  classes: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

function Wordmark({ href }: { href: string }) {
  return (
    <Link href={href} aria-label="Cadence — home" className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Cadence</span>
    </Link>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { roles, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [me, setMe] = useState<{ fullName: string; profileImageUrl: string | null } | null>(null);

  useEffect(() => {
    if (isLoading) return;
    userApi.getMe().then(setMe).catch(() => {});
  }, [isLoading]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  }

  const role = highestRole(roles);
  const navItems = NAV_BY_ROLE[role] || [];
  // Longest matching href wins, so sub-pages (e.g. a cohort's detail page)
  // highlight their parent without "/dashboard/student" swallowing every student page.
  const activeHref = navItems
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((x, y) => y.href.length - x.href.length)[0]?.href;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile top bar — menu + wordmark only; the account card lives in the drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0c1f4a] text-white flex items-center gap-3 px-4 z-30">
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-1 -ml-1 text-blue-100 hover:text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Wordmark href={HOME_BY_ROLE[role]} />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-950/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 shrink-0 z-50 flex flex-col overflow-hidden bg-[#0c1f4a] text-white
          fixed md:sticky top-0 left-0 h-screen
          transform transition-transform motion-reduce:transition-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Soft light, as on the sign-in panel */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />

        <div className="relative px-5 h-16 flex items-center justify-between">
          <Wordmark href={HOME_BY_ROLE[role]} />
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="md:hidden p-1 text-blue-100 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="relative px-6 pt-4 pb-2 text-[10.5px] font-medium uppercase tracking-[0.2em] text-blue-200/50">
          {ROLE_LABEL[role]} workspace
        </p>

        <nav className="relative flex-1 overflow-y-auto px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-white/10 text-white font-medium" : "text-blue-100/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-blue-400" />}
                <span className={isActive ? "text-blue-300" : "text-blue-200/50 group-hover:text-blue-200"}>
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Account — pinned to the bottom of the sidebar */}
        <div className="relative m-3 rounded-xl bg-white/[0.06] ring-1 ring-white/10 p-3">
          <div className="flex items-center gap-3">
            {me?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.profileImageUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/20" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-500/30 text-xs font-semibold text-blue-50 ring-2 ring-white/10">
                {me ? initials(me.fullName) : ""}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{me?.fullName ?? " "}</p>
              <p className="truncate text-xs text-blue-200/60">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-100/80 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l5-5-5-5" /><path d="M15 12H4" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="mx-auto w-full max-w-6xl md:px-4 md:pt-4 pb-10">{children}</div>
      </main>
    </div>
  );
}
