"use client";

import { useEffect, useState } from "react";
import { institutionApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";

// Platform admins only (the API refuses everyone else): every institution on
// Cadence, with the option to enter one. Entering an institution you aren't a
// member of is the platform's single cross-tenant path, and it is audited.
export default function PlatformPage() {
  const { platformAdmin, switchInstitution, institutionPublicId } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
              <th className="px-5 py-3 font-medium">Institution</th>
              <th className="px-5 py-3 font-medium">Address</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((i) => (
              <tr key={i.publicId}>
                <td className="px-5 py-3 font-medium text-gray-900">{i.name}</td>
                <td className="px-5 py-3 font-mono text-gray-500">{i.slug}</td>
                <td className="px-5 py-3 text-gray-600">{i.status}</td>
                <td className="px-5 py-3 text-gray-500">{new Date(i.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-right">
                  {i.publicId === institutionPublicId ? (
                    <span className="text-xs text-gray-400">Current</span>
                  ) : (
                    <button disabled={busyId === i.publicId}
                      onClick={async () => { setBusyId(i.publicId); try { await switchInstitution(i.publicId); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't enter"); setBusyId(null); } }}
                      className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50">
                      {busyId === i.publicId ? "Entering…" : "Enter"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
