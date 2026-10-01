"use client";

import { useEffect, useState } from "react";
import { institutionApi } from "@/lib/api";
import PageHeader from "@/components/PageHeader";

export default function InstitutionPage() {
  const [institution, setInstitution] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    institutionApi.getAll()
      .then((list) => setInstitution(list[0] || null))
      .catch(() => setLoadError(true));
  }, []);

  return (
    <div className="p-6">
      <PageHeader title="Institution" description="The organisation this workspace belongs to." />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {loadError ? (
          <p className="text-sm rounded-lg px-3 py-2 border bg-red-50 text-red-700 border-red-100">
            Failed to load institution details.
          </p>
        ) : institution ? (
          <dl className="space-y-4">
            {[
              { label: "Name", value: institution.name },
              { label: "Address", value: institution.address },
              { label: "Guardian Linkage Mode", value: institution.guardianLinkageMode },
              { label: "Created", value: new Date(institution.createdAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</dt>
                <dd className="text-sm text-gray-900">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Status</dt>
              <dd>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${institution.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {institution.isActive ? "Active" : "Inactive"}
                </span>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-400">Loading…</p>
        )}
        <p className="text-xs text-gray-400 mt-6 pt-5 border-t border-gray-100">
          Editing institution details isn't available yet — this is view-only.
        </p>
      </div>
    </div>
  );
}
