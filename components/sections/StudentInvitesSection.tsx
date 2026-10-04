"use client";

import { useEffect, useState } from "react";
import { cohortApi } from "@/lib/api";
import RowMenu from "@/components/ui/RowMenu";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

type InviteCode = {
  publicId: string;
  code: string;
  expiresAt: string | null;
  maxUses: number;
  useCount: number;
  valid: boolean;
  createdAt: string;
};

type Message = { type: "success" | "error"; text: string } | null;

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// Splits a pasted list on commas, semicolons, whitespace or new lines.
function splitList(raw: string): string[] {
  return raw.split(/[\s,;]+/).map((v) => v.trim()).filter(Boolean);
}

function signupLink(code: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/register?code=${encodeURIComponent(code)}`;
}

function shareText(code: string, cohortName: string) {
  return `You're invited to join ${cohortName} on Cadence.\n` +
    `Invite code: ${code}\n` +
    `New here? Sign up: ${signupLink(code)}\n` +
    `Already have an account? Log in and enter the code under "Join a cohort" on your dashboard.`;
}

export default function StudentInvitesSection() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [cohortPublicId, setCohortPublicId] = useState("");
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [message, setMessage] = useState<Message>(null);

  const [sharing, setSharing] = useState<InviteCode | null>(null);
  const [emails, setEmails] = useState("");
  const [phones, setPhones] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const cohortName = cohorts.find((c) => c.publicId === cohortPublicId)?.name ?? "";

  useEffect(() => {
    cohortApi.getAll().then(setCohorts).catch(() => {});
  }, []);

  async function loadCodes(id: string) {
    setCodes([]);
    setSharing(null);
    if (!id) return;
    setLoadingCodes(true);
    try {
      setCodes(await cohortApi.listInviteCodes(id));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load invite codes" });
    } finally {
      setLoadingCodes(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const created = await cohortApi.createInviteCode({
        cohortPublicId,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
      });
      setMessage({ type: "success", text: `Code ${created.code} generated. Share it below.` });
      setExpiresInDays("");
      setMaxUses("");
      const list = await cohortApi.listInviteCodes(cohortPublicId);
      setCodes(list);
      setSharing(list.find((c) => c.publicId === created.publicId) ?? null);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed — check you hold MANAGE_INVITE_CODES for this cohort",
      });
    }
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
    } catch {
      setMessage({ type: "error", text: "Couldn't copy — select and copy it manually." });
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!sharing) return;
    const emailList = splitList(emails);
    const phoneList = splitList(phones);
    if (emailList.length === 0 && phoneList.length === 0) {
      setMessage({ type: "error", text: "Add at least one email address or phone number." });
      return;
    }
    setMessage(null);
    setSending(true);
    try {
      const result = await cohortApi.sendInviteCode(sharing.publicId, { emails: emailList, phoneNumbers: phoneList });
      const parts = [
        result.emailsSent ? `${result.emailsSent} email${result.emailsSent === 1 ? "" : "s"}` : "",
        result.smsSent ? `${result.smsSent} text${result.smsSent === 1 ? "" : "s"}` : "",
      ].filter(Boolean);
      setMessage({ type: "success", text: `Sent code ${sharing.code} — ${parts.join(" and ")}.` });
      setEmails("");
      setPhones("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to send invite code" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Students use a code to sign up, or to join a cohort from their dashboard if they already have an account.
      </p>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-4 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-gray-200 shadow-sm">
        {/* Cohort + generate */}
        <form onSubmit={handleGenerate} className="p-5 border-b border-gray-100 space-y-3">
          <select
            required value={cohortPublicId}
            onChange={(e) => { setCohortPublicId(e.target.value); setMessage(null); loadCodes(e.target.value); }}
            className={`${inputClass} max-w-md`}
          >
            <option value="">Select a cohort…</option>
            {cohorts.map((c) => (
              <option key={c.publicId} value={c.publicId}>{c.name}</option>
            ))}
          </select>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-gray-500">
              Expires after (days)
              <input
                type="number" min={1} placeholder="Never"
                value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)}
                className={`${inputClass} mt-1 w-32`}
              />
            </label>
            <label className="text-xs text-gray-500">
              Max uses
              <input
                type="number" min={1} placeholder="Unlimited"
                value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
                className={`${inputClass} mt-1 w-32`}
              />
            </label>
            <button
              type="submit" disabled={!cohortPublicId}
              className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Generate Code
            </button>
          </div>
        </form>

        {/* Existing codes */}
        {cohortPublicId && (
          <div className="p-5">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Codes for {cohortName}</h3>
            {loadingCodes ? (
              <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
            ) : codes.length === 0 ? (
              <p className="text-sm text-gray-400">No codes yet — generate one above.</p>
            ) : (
              <div className="-mx-5">
                <Table>
                  <thead>
                    <tr>
                      <Th>Code</Th>
                      <Th>Status</Th>
                      <Th className="hidden sm:table-cell">Used</Th>
                      <Th className="hidden sm:table-cell">Expires</Th>
                      <Th align="right"><span className="sr-only">Actions</span></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((c) => (
                      <Tr key={c.publicId} muted={!c.valid}>
                        <Td><span className="font-mono text-base font-semibold text-gray-900">{c.code}</span></Td>
                        <Td>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.valid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {c.valid ? "Active" : "Inactive"}
                          </span>
                        </Td>
                        <Td className="hidden sm:table-cell text-gray-600">{c.useCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</Td>
                        <Td className="hidden sm:table-cell whitespace-nowrap text-gray-600">
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}
                        </Td>
                        <Td align="right">
                          {copied === `code-${c.publicId}` || copied === `link-${c.publicId}` ? (
                            <span className="text-xs text-green-600">Copied</span>
                          ) : c.valid ? (
                            <RowMenu label={`Actions for ${c.code}`} items={[
                              { label: "Send to students", onSelect: () => setSharing(c) },
                              { label: "Copy code", onSelect: () => copy(`code-${c.publicId}`, c.code) },
                              { label: "Copy signup link", onSelect: () => copy(`link-${c.publicId}`, signupLink(c.code)) },
                            ]} />
                          ) : null}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Send panel */}
        {sharing && (
          <form onSubmit={handleSend} className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Send <span className="font-mono">{sharing.code}</span> to students
              </h3>
              <button type="button" onClick={() => setSharing(null)} className="text-xs text-gray-400 hover:text-gray-700">
                Close
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-gray-500">
                Email addresses
                <textarea
                  rows={4} placeholder={"ada@example.com\nchidi@example.com"}
                  value={emails} onChange={(e) => setEmails(e.target.value)}
                  className={`${inputClass} mt-1 font-mono`}
                />
              </label>
              <label className="text-xs text-gray-500">
                Phone numbers (text message)
                <textarea
                  rows={4} placeholder={"+2348012345678\n+2348098765432"}
                  value={phones} onChange={(e) => setPhones(e.target.value)}
                  className={`${inputClass} mt-1 font-mono`}
                />
              </label>
            </div>
            <p className="text-xs text-gray-400">Separate entries with commas or new lines.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit" disabled={sending}
                className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send invite"}
              </button>
              <button
                type="button"
                onClick={() => copy("message", shareText(sharing.code, cohortName))}
                className="text-sm text-blue-600 hover:underline"
              >
                {copied === "message" ? "Copied" : "Copy message (for WhatsApp, etc.)"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
