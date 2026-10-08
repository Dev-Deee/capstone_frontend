"use client";

import { Fragment, useEffect, useState } from "react";
import { platformApi, type PlatformInstitution, type PlatformOverview } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/ui/Avatar";
import ListToolbar from "@/components/ui/ListToolbar";
import RowMenu, { type MenuItem } from "@/components/ui/RowMenu";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Stat, icon } from "@/components/analytics/parts";

type Status = PlatformInstitution["status"];
type Filter = "ALL" | Status;
type Change = { id: string; to: Status } | null;

const STATUS: Record<Status, [string, string]> = {
  ACTIVE: ["Active", "bg-green-100 text-green-700"],
  PENDING: ["Pending", "bg-amber-100 text-amber-700"],
  SUSPENDED: ["Suspended", "bg-red-100 text-red-700"],
};

const VERB: Record<Status, string> = { ACTIVE: "Reactivate", PENDING: "Mark pending", SUSPENDED: "Suspend" };
const EFFECT: Record<Status, string> = {
  ACTIVE: "Members can sign in and use it again.",
  PENDING: "Members are locked out until it's activated.",
  SUSPENDED: "Members are locked out on their next request. Nothing is deleted.",
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

// The platform console (platform admins only — the API refuses everyone else):
// every institution on Cadence, its owner and size, entering one (audited),
// and changing its status (with a reason, audited).
export default function PlatformPage() {
  const { platformAdmin, switchInstitution, institutionPublicId } = useAuth();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [list, setList] = useState<PlatformInstitution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [change, setChange] = useState<Change>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([platformApi.overview(), platformApi.institutions()])
      .then(([o, l]) => { setOverview(o); setList(l); })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the platform console"));
  }

  useEffect(() => { if (platformAdmin) load(); }, [platformAdmin]);

  if (!platformAdmin) {
    return <div className="p-6"><PageHeader title="Platform" description="This page is for Cadence platform admins." /></div>;
  }

  const q = search.trim().toLowerCase();
  const matching = list.filter((i) => !q || [i.name, i.slug, i.ownerName, i.ownerEmail].some((v) => v?.toLowerCase().includes(q)));
  const visible = matching.filter((i) => filter === "ALL" || i.status === filter);

  async function enter(i: PlatformInstitution) {
    setBusyId(i.publicId);
    try {
      await switchInstitution(i.publicId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't enter");
      setBusyId(null);
    }
  }

  async function saveChange(i: PlatformInstitution) {
    if (!change || !reason.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await platformApi.changeStatus(i.publicId, change.to, reason.trim());
      setList((prev) => prev.map((x) => (x.publicId === updated.publicId ? updated : x)));
      platformApi.overview().then(setOverview).catch(() => {});
      setMessage(`${i.name} is now ${STATUS[updated.status][0].toLowerCase()}. The change and your reason are in the audit log.`);
      setChange(null);
      setReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't change the status");
    } finally {
      setSaving(false);
    }
  }

  function menuFor(i: PlatformInstitution): MenuItem[] {
    const items: MenuItem[] = [];
    if (i.publicId !== institutionPublicId) items.push({ label: "Enter institution", onSelect: () => enter(i) });
    (["ACTIVE", "PENDING", "SUSPENDED"] as Status[])
      .filter((s) => s !== i.status)
      .forEach((s) => items.push({
        label: VERB[s],
        tone: s === "SUSPENDED" ? "danger" : undefined,
        onSelect: () => { setMessage(null); setReason(""); setChange({ id: i.publicId, to: s }); },
      }));
    return items;
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader eyebrow="Platform" title="Platform"
        description="Every institution on Cadence. Entering one you don't belong to gives you owner access there; status changes lock or unlock its members. Both are recorded in the audit log." />

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Institutions" value={overview ? String(overview.institutions) : "—"}
          hint={overview ? `${overview.newLast30Days} new in the last 30 days` : ""}
          icon={icon(<><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M2 21h20M8 7h4M8 11h4M8 15h4" /></>)} />
        <Stat label="Active" value={overview ? String(overview.active) : "—"} hint="Usable by their members"
          icon={icon(<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>)} />
        <Stat label="Pending or suspended" value={overview ? String(overview.pending + overview.suspended) : "—"}
          hint={overview ? `${overview.pending} pending · ${overview.suspended} suspended` : ""}
          icon={icon(<><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>)} />
        <Stat label="People" value={overview ? String(overview.users) : "—"}
          hint={overview ? `${overview.memberships} active memberships` : ""}
          icon={icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /></>)} />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "institution" : "institutions"}
          segments={[
            { value: "ALL" as Filter, label: "All", count: matching.length },
            { value: "ACTIVE" as Filter, label: "Active", count: matching.filter((i) => i.status === "ACTIVE").length },
            { value: "PENDING" as Filter, label: "Pending", count: matching.filter((i) => i.status === "PENDING").length },
            { value: "SUSPENDED" as Filter, label: "Suspended", count: matching.filter((i) => i.status === "SUSPENDED").length },
          ]}
          segment={filter}
          onSegment={setFilter}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Name, handle or owner…"
        />
        {visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">{list.length === 0 ? "Loading…" : "No institutions match."}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Institution</Th>
                <Th className="hidden lg:table-cell">Owner</Th>
                <Th className="hidden sm:table-cell" align="right">Members</Th>
                <Th className="hidden md:table-cell">Created</Th>
                <Th>Status</Th>
                <Th align="right"><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => {
                const [label, cls] = STATUS[i.status];
                const changing = change?.id === i.publicId ? change : null;
                return (
                  <Fragment key={i.publicId}>
                    <Tr muted={i.status !== "ACTIVE"}>
                      <Td>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={i.name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">
                              {i.name}
                              {i.publicId === institutionPublicId && <span className="ml-1.5 text-xs font-normal text-gray-400">(you're here)</span>}
                            </p>
                            <p className="truncate font-mono text-xs text-gray-400">{i.slug}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="hidden lg:table-cell">
                        {i.ownerName ? (
                          <>
                            <p className="text-gray-700">{i.ownerName}</p>
                            <p className="text-xs text-gray-400">{i.ownerEmail}</p>
                          </>
                        ) : <span className="text-gray-300">—</span>}
                      </Td>
                      <Td className="hidden sm:table-cell text-gray-600" align="right">{i.members}</Td>
                      <Td className="hidden md:table-cell whitespace-nowrap text-gray-500">{fmtDate(i.createdAt)}</Td>
                      <Td><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span></Td>
                      <Td align="right">
                        {busyId === i.publicId ? <span className="text-xs text-gray-400">Entering…</span>
                          : <RowMenu items={menuFor(i)} label={`Actions for ${i.name}`} />}
                      </Td>
                    </Tr>
                    {changing && (
                      <tr>
                        <td colSpan={6} className="px-4 pb-4">
                          <form
                            onSubmit={(e) => { e.preventDefault(); saveChange(i); }}
                            className={`space-y-3 rounded-xl border p-4 ${changing.to === "SUSPENDED" ? "border-red-100 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                          >
                            <p className={`text-sm ${changing.to === "SUSPENDED" ? "text-red-700" : "text-gray-700"}`}>
                              <span className="font-medium">{VERB[changing.to]} {i.name}?</span> {EFFECT[changing.to]}
                            </p>
                            <input
                              required
                              autoFocus
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              maxLength={500}
                              placeholder="Reason (kept in the audit log)"
                              className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <button type="submit" disabled={saving || !reason.trim()}
                                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                                  changing.to === "SUSPENDED" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                                }`}>
                                {saving ? "Saving…" : VERB[changing.to]}
                              </button>
                              <button type="button" onClick={() => setChange(null)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-surface">
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
