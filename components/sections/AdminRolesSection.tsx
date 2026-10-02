"use client";

import { Fragment, useEffect, useState } from "react";
import { adminRoleApi } from "@/lib/api";
import ListToolbar from "@/components/ui/ListToolbar";
import RowMenu from "@/components/ui/RowMenu";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

const AVAILABLE_PERMISSIONS = [
  "MANAGE_COHORTS", "MANAGE_SUBJECTS", "MANAGE_FACILITATOR_ASSIGNMENTS",
  "MANAGE_INVITE_CODES", "MANAGE_ENROLLMENTS", "MANAGE_RESUMPTION_CODES", "VIEW_FEEDBACK",
  "MANAGE_USERS", "VIEW_INSTITUTION_ANALYTICS",
];

function formatPermission(perm: string): string {
  return perm.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminRolesSection() {
  const [roles, setRoles] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const visible = roles.filter((r) => !q || [r.name, r.description, ...(r.permissions || []).map(formatPermission)]
    .some((v: string | null) => v?.toLowerCase().includes(q)));

  function loadRoles() {
    adminRoleApi.getAll().then(setRoles).catch(() => {});
  }

  useEffect(() => { loadRoles(); }, []);

  function togglePermission(list: string[], setList: (v: string[]) => void, perm: string) {
    setList(list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const role = await adminRoleApi.create({ name, description, permissions: selectedPermissions });
      setRoles((prev) => [...prev, role]);
      setMessage({ type: "success", text: `Admin role "${name}" created.` });
      setName(""); setDescription(""); setSelectedPermissions([]);
      setCreating(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create role" });
    }
  }

  function startEdit(role: any) {
    setEditingId(role.publicId);
    setEditName(role.name);
    setEditDescription(role.description || "");
    setEditPermissions(role.permissions || []);
    setEditIsActive(role.isActive);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setMessage(null);
    try {
      const updated = await adminRoleApi.update(editingId, {
        name: editName, description: editDescription,
        permissions: editPermissions, isActive: editIsActive,
      });
      setRoles((prev) => prev.map((r) => (r.publicId === editingId ? updated : r)));
      setMessage({ type: "success", text: "Role updated." });
      setEditingId(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update role" });
    }
  }

  return (
    <div>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "admin role" : "admin roles"}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Role or permission…"
        >
          <button
            type="button"
            onClick={() => setCreating((c) => !c)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {creating ? "Close" : "New role"}
          </button>
        </ListToolbar>

        {creating && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
          <form onSubmit={handleCreate} className="space-y-3 max-w-lg">
            <input
              type="text" required placeholder="Role name (e.g. Community Manager)"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text" placeholder="Description (optional)"
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm)}
                    onChange={() => togglePermission(selectedPermissions, setSelectedPermissions, perm)}
                  />
                  {formatPermission(perm)}
                </label>
              ))}
            </div>
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700">
              Create Role
            </button>
          </form>
          </div>
        )}

        {roles.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No admin roles yet — a role is a named set of permissions you can give admins.</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No roles match.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Role</Th>
                <Th className="hidden md:table-cell">Permissions</Th>
                <Th>Status</Th>
                <Th align="right"><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <Fragment key={r.publicId}>
                  <Tr muted={!r.isActive}>
                    <Td>
                      <p className="font-medium text-gray-900">{r.name}</p>
                      {r.description && <p className="text-xs text-gray-400">{r.description}</p>}
                    </Td>
                    <Td className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(r.permissions || []).map((perm: string) => (
                          <span key={perm} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{formatPermission(perm)}</span>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </Td>
                    <Td align="right">
                      <RowMenu label={`Actions for ${r.name}`} items={[{ label: "Edit role", onSelect: () => startEdit(r) }]} />
                    </Td>
                  </Tr>
                  {editingId === r.publicId && (
                    <tr>
                      <td colSpan={4} className="px-4 pb-4">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <form onSubmit={handleSaveEdit} className="space-y-3 max-w-lg">
                      <input
                        type="text" required value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text" value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {AVAILABLE_PERMISSIONS.map((perm) => (
                          <label key={perm} className="flex items-center gap-2 text-xs text-gray-700">
                            <input
                              type="checkbox"
                              checked={editPermissions.includes(perm)}
                              onChange={() => togglePermission(editPermissions, setEditPermissions, perm)}
                            />
                            {formatPermission(perm)}
                          </label>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-gray-700">
                        <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="flex-1 border border-gray-200 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </form>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
