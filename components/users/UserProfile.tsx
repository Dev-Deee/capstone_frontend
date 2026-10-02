"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { analyticsApi, cohortApi, userApi, type StudentAttendanceDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/Avatar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import TabBar from "@/components/TabBar";
import AttendanceStatusBadge, { countsAsAttended } from "@/components/AttendanceStatusBadge";
import {
  ConfirmRemove, EditUserForm, MoveCohortForm, RolesForm, ROLE_LABEL, UserStatusBadge,
  permissionsFor, toggleActive, type ManagedUser,
} from "@/components/users/UserForms";

type Message = { type: "success" | "error"; text: string } | null;
type Action = "edit" | "roles" | "move" | "remove" | null;

const card = "rounded-2xl border border-gray-200 bg-surface shadow-sm";

function rate(entries: { status: string }[]) {
  const held = entries.filter((e) => e.status !== "OPEN");
  if (held.length === 0) return null;
  return Math.round((held.filter((e) => countsAsAttended(e.status)).length / held.length) * 100);
}

const fmtDate = (d: string) =>
  new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (t: string | null) =>
  t ? new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : null;

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-1 truncate text-sm text-gray-900">{children ?? <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}

// One person's page: who they are, their attendance, and (for those allowed)
// the same management actions as the list's row menu.
export default function UserProfile({ publicId, listHref, listLabel }: {
  publicId: string;
  listHref: string;
  listLabel: string;
}) {
  const router = useRouter();
  const { roles: myRoles } = useAuth();
  const viewerIsSuperAdmin = myRoles.includes("SUPER_ADMIN");
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [cohorts, setCohorts] = useState<{ publicId: string; name: string }[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendanceDetail | null>(null);
  const [attendanceNote, setAttendanceNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [tab, setTab] = useState("attendance");
  const [action, setAction] = useState<Action>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([userApi.getOne(publicId), userApi.getMe()])
      .then(([u, me]) => {
        setUser(u);
        setMeId(me.publicId);
        if (!u.roles.includes("STUDENT")) setTab("manage");
        cohortApi.getAll().then(setCohorts).catch(() => {});
        if (u.roles.includes("STUDENT")) {
          analyticsApi.student(publicId).then(setAttendance).catch((err) => setAttendanceNote(
            /permission/i.test(err?.message ?? "")
              ? "Attendance needs the View institution analytics permission for this student's cohort."
              : "Couldn't load attendance."));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load this person"));
  }, [publicId]);

  if (error) {
    return (
      <div className="p-6">
        <Breadcrumbs items={[{ label: listLabel, href: listHref }, { label: "Not found" }]} />
        <div className={`${card} mt-6 p-6`}>
          <p className="text-sm font-medium text-gray-900">This person isn&apos;t available</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }
  if (!user) return <div className="p-6 text-sm text-gray-400 animate-pulse">Loading…</div>;

  const p = permissionsFor(user, viewerIsSuperAdmin, meId);
  const isStudent = user.roles.includes("STUDENT");
  const campusRate = attendance ? rate(attendance.resumption) : null;
  const classRate = attendance ? rate(attendance.classes) : null;
  const timeline = attendance
    ? [
        ...attendance.resumption.map((e) => ({ key: "r" + e.sessionPublicId, date: e.date, title: "Campus resumption", status: e.status, at: e.checkedInAt })),
        ...attendance.classes.map((e) => ({ key: "c" + e.sessionPublicId, date: e.date, title: e.subjectName, status: e.status, at: e.markedAt })),
      ].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  function saved(updated: ManagedUser, text: string) {
    setUser(updated);
    setAction(null);
    setMessage({ type: "success", text });
  }

  async function suspendOrRestore() {
    if (!user) return;
    setBusy(true);
    setMessage(null);
    try {
      const [updated, text] = await toggleActive(user);
      saved(updated, text);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change status" });
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    ...(isStudent ? [{ id: "attendance", label: "Attendance" }] : []),
    { id: "manage", label: "Manage" },
  ];
  const actionButton = "rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50";

  return (
    <div className="p-6 space-y-5">
      <Breadcrumbs items={[{ label: listLabel, href: listHref }, { label: user.fullName }]} />

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>{message.text}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile */}
        <section className={`${card} p-6 text-center`}>
          <div className="flex justify-center"><Avatar name={user.fullName} src={user.profileImageUrl} size={80} /></div>
          <h1 className="mt-4 text-lg font-semibold text-gray-900">{user.fullName}{p.isSelf && <span className="ml-1.5 text-sm font-normal text-gray-400">(you)</span>}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{user.roles.map((r) => ROLE_LABEL[r] ?? r).join(" · ")}</p>
          <div className="mt-3 flex justify-center"><UserStatusBadge user={user} /></div>
          {isStudent && (
            <div className="mt-6 grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 pt-5">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{campusRate == null ? "—" : `${campusRate}%`}</p>
                <p className="text-xs text-gray-400">Campus attendance</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{classRate == null ? "—" : `${classRate}%`}</p>
                <p className="text-xs text-gray-400">Class attendance</p>
              </div>
            </div>
          )}
        </section>

        {/* Details */}
        <section className={`${card} p-6 lg:col-span-2`}>
          <h2 className="text-sm font-semibold text-gray-900">Details</h2>
          <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            <Info label="Email">{user.email}</Info>
            <Info label="Phone">{user.phoneNumber}</Info>
            <Info label="Institution ID">{user.institutionStudentId}</Info>
            <Info label="Cohort">{user.cohortName}</Info>
            <Info label="Roles">{user.roles.map((r) => ROLE_LABEL[r] ?? r).join(", ")}</Info>
            <Info label="Account">{user.accountPending ? "Invite not yet accepted" : "Set up"}</Info>
          </dl>
        </section>
      </div>

      <section className={`${card} p-5`}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />

        {tab === "attendance" && (
          attendanceNote ? <p className="text-sm text-gray-500">{attendanceNote}</p>
          : !attendance ? <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
          : timeline.length === 0 ? (
            <p className="text-sm text-gray-400">{attendance.cohortName ? "Nothing held since they joined." : "Not in an active cohort here."}</p>
          ) : (
            <ol className="relative ml-2 border-l border-gray-200">
              {timeline.slice(0, 60).map((e) => (
                <li key={e.key} className="relative pb-4 pl-6 last:pb-0">
                  <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                    countsAsAttended(e.status) ? "bg-blue-600" : e.status === "OPEN" ? "bg-gray-300" : "bg-red-400"
                  }`} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.title}</p>
                      <p className="text-xs text-gray-400">{fmtDate(e.date)}{fmtTime(e.at) ? ` · ${fmtTime(e.at)}` : ""}</p>
                    </div>
                    <AttendanceStatusBadge status={e.status} />
                  </div>
                </li>
              ))}
            </ol>
          )
        )}

        {tab === "manage" && (
          <div className="space-y-4">
            {!(p.canEdit || p.canRoles || p.canMove || p.canChangeStatus) ? (
              <p className="text-sm text-gray-500">You can view this person, but managing their account is for a super admin.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {p.canEdit && <button className={actionButton} onClick={() => setAction("edit")}>Edit details</button>}
                {p.canRoles && <button className={actionButton} onClick={() => setAction("roles")}>Change roles</button>}
                {p.canMove && <button className={actionButton} onClick={() => setAction("move")}>{user.cohortName ? "Change cohort" : "Add to cohort"}</button>}
                {p.canChangeStatus && (
                  <button className={`${actionButton} ${user.active ? "text-amber-700" : "text-green-700"}`} disabled={busy} onClick={suspendOrRestore}>
                    {busy ? "…" : user.active ? "Suspend" : "Restore access"}
                  </button>
                )}
                {p.canChangeStatus && <button className={`${actionButton} text-red-600`} onClick={() => setAction("remove")}>Remove from institution</button>}
              </div>
            )}
            {action === "edit" && <EditUserForm user={user} onSaved={saved} onCancel={() => setAction(null)} />}
            {action === "roles" && <RolesForm user={user} onSaved={saved} onCancel={() => setAction(null)} />}
            {action === "move" && <MoveCohortForm user={user} cohorts={cohorts} onSaved={saved} onCancel={() => setAction(null)} />}
            {action === "remove" && <ConfirmRemove user={user} onCancel={() => setAction(null)} onRemoved={() => router.push(listHref)} />}
          </div>
        )}
      </section>
    </div>
  );
}
