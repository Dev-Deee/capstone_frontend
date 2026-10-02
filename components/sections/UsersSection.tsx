"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { userApi, cohortApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/Avatar";
import ListToolbar from "@/components/ui/ListToolbar";
import RowMenu, { type MenuItem } from "@/components/ui/RowMenu";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import {
  ConfirmRemove, EditUserForm, MoveCohortForm, RolesForm, ROLE_LABEL, UserStatusBadge,
  permissionsFor, toggleActive, type ManagedUser,
} from "@/components/users/UserForms";

type Message = { type: "success" | "error"; text: string } | null;
type RoleFilter = "ALL" | "STUDENT" | "FACILITATOR" | "ADMIN" | "SUPER_ADMIN";
type Panel = { id: string; kind: "edit" | "roles" | "move" | "remove" } | null;

const SEGMENTS: { value: RoleFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "STUDENT", label: "Students" },
  { value: "FACILITATOR", label: "Facilitators" },
  { value: "ADMIN", label: "Admins" },
  { value: "SUPER_ADMIN", label: "Super admins" },
];

// Everyone in the institution: a table with role tabs and search; the row
// menu holds the management actions, and a row opens the person's page.
export default function UsersSection({ detailHref }: { detailHref?: (publicId: string) => string }) {
  const router = useRouter();
  const { roles: myRoles } = useAuth();
  const viewerIsSuperAdmin = myRoles.includes("SUPER_ADMIN");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [cohorts, setCohorts] = useState<{ publicId: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [message, setMessage] = useState<Message>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([userApi.getAll(), userApi.getMe()])
      .then(([list, me]) => { setUsers(list); setMeId(me.publicId); })
      .then(() => cohortApi.getAll().then(setCohorts).catch(() => {}))
      .catch((err) => {
        const text = err instanceof Error ? err.message : "Failed to load users";
        setMessage({
          type: "error",
          text: (text.includes("MANAGE_USERS") || text.toLowerCase().includes("permission"))
            ? "You need the Manage Users permission to see this list. Ask a super admin to add it to your admin role."
            : text,
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const matching = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => !q || [u.fullName, u.email, u.phoneNumber, u.institutionStudentId, u.cohortName]
      .some((v) => v?.toLowerCase().includes(q)));
  }, [users, search]);
  const visible = matching.filter((u) => roleFilter === "ALL" || u.roles.includes(roleFilter));
  const segments = SEGMENTS.map((s) => ({
    ...s, count: s.value === "ALL" ? matching.length : matching.filter((u) => u.roles.includes(s.value)).length,
  }));

  function saved(updated: ManagedUser, text: string) {
    setUsers((prev) => prev.map((u) => (u.publicId === updated.publicId ? updated : u)));
    setPanel(null);
    setMessage({ type: "success", text });
  }

  async function suspendOrRestore(u: ManagedUser) {
    setBusyId(u.publicId);
    setMessage(null);
    try {
      const [updated, text] = await toggleActive(u);
      saved(updated, text);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change status" });
    } finally {
      setBusyId(null);
    }
  }

  function menuFor(u: ManagedUser): MenuItem[] {
    const p = permissionsFor(u, viewerIsSuperAdmin, meId);
    const open = (kind: NonNullable<Panel>["kind"]) => () => { setMessage(null); setPanel({ id: u.publicId, kind }); };
    const items: MenuItem[] = [];
    if (detailHref) items.push({ label: "View profile", onSelect: () => router.push(detailHref(u.publicId)) });
    if (p.canEdit) items.push({ label: "Edit details", onSelect: open("edit") });
    if (p.canRoles) items.push({ label: "Change roles", onSelect: open("roles") });
    if (p.canMove) items.push({ label: u.cohortName ? "Change cohort" : "Add to cohort", onSelect: open("move") });
    if (p.canChangeStatus) {
      items.push({ label: u.active ? "Suspend" : "Restore access", onSelect: () => suspendOrRestore(u), tone: u.active ? "warn" : undefined });
      items.push({ label: "Remove from institution", onSelect: open("remove"), tone: "danger" });
    }
    return items;
  }

  return (
    <div>
      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-4 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "person" : "people"}
          segments={segments}
          segment={roleFilter}
          onSegment={setRoleFilter}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Name, email, phone, ID, cohort…"
        />
        {isLoading ? (
          <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">{users.length === 0 ? "No users found." : "No one matches."}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th className="hidden lg:table-cell">Cohort</Th>
                <Th className="hidden xl:table-cell">Phone</Th>
                <Th>Status</Th>
                <Th align="right"><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const isSelf = u.publicId === meId;
                const p = panel?.id === u.publicId ? panel : null;
                return (
                  <Fragment key={u.publicId}>
                    <Tr muted={!u.active} onOpen={detailHref ? () => router.push(detailHref(u.publicId)) : undefined}>
                      <Td>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={u.fullName} src={u.profileImageUrl} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">
                              {u.fullName}{isSelf && <span className="ml-1.5 text-xs font-normal text-gray-400">(you)</span>}
                            </p>
                            <p className="truncate text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-gray-600 whitespace-nowrap">{u.roles.map((r) => ROLE_LABEL[r] ?? r).join(", ")}</Td>
                      <Td className="hidden lg:table-cell whitespace-nowrap text-gray-600">{u.cohortName ?? <span className="text-gray-300">—</span>}</Td>
                      <Td className="hidden xl:table-cell whitespace-nowrap text-gray-600">{u.phoneNumber ?? <span className="text-gray-300">—</span>}</Td>
                      <Td><UserStatusBadge user={u} /></Td>
                      <Td align="right">
                        {busyId === u.publicId ? <span className="text-xs text-gray-400">…</span> : <RowMenu items={menuFor(u)} label={`Actions for ${u.fullName}`} />}
                      </Td>
                    </Tr>
                    {p && (
                      <tr>
                        <td colSpan={6} className="px-4 pb-4">
                          {p.kind === "edit" && <EditUserForm user={u} onSaved={saved} onCancel={() => setPanel(null)} />}
                          {p.kind === "roles" && <RolesForm user={u} onSaved={saved} onCancel={() => setPanel(null)} />}
                          {p.kind === "move" && <MoveCohortForm user={u} cohorts={cohorts} onSaved={saved} onCancel={() => setPanel(null)} />}
                          {p.kind === "remove" && (
                            <ConfirmRemove user={u} onCancel={() => setPanel(null)} onRemoved={(text) => {
                              setUsers((prev) => prev.filter((x) => x.publicId !== u.publicId));
                              setPanel(null);
                              setMessage({ type: "success", text });
                            }} />
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
