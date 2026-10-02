"use client";

import { useEffect, useState } from "react";
import { institutionApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/ui/Avatar";
import ListToolbar from "@/components/ui/ListToolbar";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

// Platform admins only (the API refuses everyone else): every institution on
// Cadence, with the option to enter one. Entering an institution you aren't a
// member of is the platform's single cross-tenant path, and it is audited.
export default function PlatformPage() {
  const { platformAdmin, switchInstitution, institutionPublicId } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const visible = list.filter((i) => !q || [i.name, i.slug].some((v: string) => v?.toLowerCase().includes(q)));

  useEffect(() => {
    institutionApi.getAll().then(setList).catch((e) => setError(e instanceof Error ? e.message : "Couldn't load institutions"));
  }, []);

  if (!platformAdmin) {
    return <div className="p-6"><PageHeader title="Institutions" description="This page is for Cadence platform admins." /></div>;
  }

  return (
    <div className="p-6">
      <PageHeader eyebrow="Platform" title="All institutions"
        description="Every institution on Cadence. Entering one you don't belong to gives you owner access there, and is recorded in the audit log." />
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</div>}
      <div className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar count={visible.length} noun={visible.length === 1 ? "institution" : "institutions"}
          search={search} onSearch={setSearch} searchPlaceholder="Name or address…" />
        <Table>
          <thead>
            <tr>
              <Th>Institution</Th>
              <Th className="hidden md:table-cell">Status</Th>
              <Th className="hidden sm:table-cell">Created</Th>
              <Th align="right"><span className="sr-only">Enter</span></Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => (
              <Tr key={i.publicId}>
                <Td>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={i.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{i.name}</p>
                      <p className="truncate font-mono text-xs text-gray-400">{i.slug}</p>
                    </div>
                  </div>
                </Td>
                <Td className="hidden md:table-cell text-gray-600">{i.status}</Td>
                <Td className="hidden sm:table-cell whitespace-nowrap text-gray-500">{new Date(i.createdAt).toLocaleDateString()}</Td>
                <Td align="right">
                  {i.publicId === institutionPublicId ? (
                    <span className="text-xs text-gray-400">Current</span>
                  ) : (
                    <button disabled={busyId === i.publicId}
                      onClick={async () => { setBusyId(i.publicId); try { await switchInstitution(i.publicId); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't enter"); setBusyId(null); } }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                      {busyId === i.publicId ? "Entering…" : "Enter"}
                    </button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
