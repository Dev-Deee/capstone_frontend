"use client";

import { Fragment, useEffect, useState } from "react";
import { subjectApi } from "@/lib/api";
import ListToolbar from "@/components/ui/ListToolbar";
import RowMenu from "@/components/ui/RowMenu";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

export default function SubjectsSection() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const visible = subjects.filter((s) => !q || [s.name, s.description].some((v: string | null) => v?.toLowerCase().includes(q)));

  useEffect(() => {
    subjectApi.getAll().then(setSubjects).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const subject = await subjectApi.create({ name, description });
      setSubjects((prev) => [...prev, subject]);
      setMessage({ type: "success", text: `Subject "${subject.name}" created.` });
      setName(""); setDescription("");
      setCreating(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create subject" });
    }
  }

  function startEdit(subject: any) {
    setEditingId(subject.publicId);
    setEditName(subject.name);
    setMessage(null);
  }

  async function handleSaveEdit(publicId: string) {
    if (!editName.trim()) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await subjectApi.update(publicId, { name: editName.trim() });
      setSubjects((prev) => prev.map((s) => (s.publicId === publicId ? updated : s)));
      setEditingId(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update subject" });
    } finally {
      setIsSaving(false);
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
            noun={visible.length === 1 ? "subject" : "subjects"}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Subject…"
          >
            <button
              type="button"
              onClick={() => setCreating((c) => !c)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {creating ? "Close" : "New subject"}
            </button>
          </ListToolbar>

          {creating && (
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
            <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
              <input
                  type="text" required placeholder="Subject name"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                  type="text" placeholder="Description (optional)"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700">
                Create Subject
              </button>
            </form>
            </div>
          )}

          {subjects.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No subjects yet — add the first one.</p>
          ) : visible.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No subjects match.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Subject</Th>
                  <Th className="hidden sm:table-cell">Description</Th>
                  <Th align="right"><span className="sr-only">Actions</span></Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <Fragment key={s.publicId}>
                    <Tr>
                      <Td className="font-medium text-gray-900">{s.name}</Td>
                      <Td className="hidden sm:table-cell text-gray-500">{s.description || <span className="text-gray-300">—</span>}</Td>
                      <Td align="right">
                        <RowMenu label={`Actions for ${s.name}`} items={[{ label: "Rename", onSelect: () => startEdit(s) }]} />
                      </Td>
                    </Tr>
                    {editingId === s.publicId && (
                      <tr>
                        <td colSpan={3} className="px-4 pb-4">
                          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="min-w-[12rem] flex-1 rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(s.publicId)}
                              disabled={isSaving}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isSaving ? "Saving…" : "Save"}
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-900">
                              Cancel
                            </button>
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