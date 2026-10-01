"use client";

import { useEffect, useState } from "react";
import { subjectApi } from "@/lib/api";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-5">Subjects</h1>

        {message && (
            <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
                message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
            }`}>
              {message.text}
            </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Create Subject</h2>
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

          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Existing Subjects</h2>
            {subjects.length === 0 ? (
                <p className="text-sm text-gray-400">No subjects yet.</p>
            ) : (
                <ul className="divide-y divide-gray-100">
                  {subjects.map((s) => (
                      <li key={s.publicId} className="py-2.5 text-sm text-gray-700 flex items-center justify-between gap-3">
                        {editingId === s.publicId ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="flex-1 px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                              />
                              <button
                                  onClick={() => handleSaveEdit(s.publicId)}
                                  disabled={isSaving}
                                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isSaving ? "Saving…" : "Save"}
                              </button>
                              <button
                                  onClick={() => setEditingId(null)}
                                  className="text-xs text-gray-500 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>
                        ) : (
                            <>
                              <span>{s.name}</span>
                              <button onClick={() => startEdit(s)} className="text-xs text-blue-600 hover:underline">
                                Edit
                              </button>
                            </>
                        )}
                      </li>
                  ))}
                </ul>
            )}
          </div>
        </div>
      </div>
  );
}