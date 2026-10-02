"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { cohortApi } from "@/lib/api";
import PageHeader from "@/components/PageHeader";

export default function CohortDetailPage() {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const [cohort, setCohort] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    function load() {
        const publicId = params.publicId as string;
        cohortApi.getOne(publicId)
            .then((data) => { setCohort(data); setNameDraft(data.name); })
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load cohort"));
    }

    useEffect(() => {
        load();
    }, [params.publicId]);

    async function handleSaveName() {
        if (!cohort || !nameDraft.trim()) return;
        setIsSaving(true);
        setError(null);
        try {
            const updated = await cohortApi.update(cohort.publicId, { name: nameDraft.trim() });
            setCohort(updated);
            setIsEditingName(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update cohort name");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="p-6">
            <button onClick={() => router.push(pathname.startsWith("/dashboard/admin") ? "/dashboard/admin/cohorts" : "/dashboard/super-admin/cohorts")} className="text-xs text-gray-400 hover:text-gray-700 mb-5 block">
                ← Back to Cohorts
            </button>

            <PageHeader title="Cohort Detail" />

            {error && (
                <div className="text-sm rounded-lg px-3 py-2 border bg-red-50 text-red-700 border-red-100 mb-5">
                    {error}
                </div>
            )}

            <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-6">
                {cohort ? (
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Name</dt>
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={nameDraft}
                                        onChange={(e) => setNameDraft(e.target.value)}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        disabled={isSaving}
                                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isSaving ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                        onClick={() => { setIsEditingName(false); setNameDraft(cohort.name); }}
                                        className="text-xs text-gray-500 hover:text-gray-900"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <dd className="text-sm text-gray-900 flex items-center gap-2">
                                    {cohort.name}
                                    <button onClick={() => setIsEditingName(true)} className="text-xs text-blue-600 hover:underline">
                                        Edit
                                    </button>
                                </dd>
                            )}
                        </div>

                        {[
                            { label: "Start Date", value: cohort.startDate },
                            { label: "End Date", value: cohort.endDate },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</dt>
                                <dd className="text-sm text-gray-900">{value}</dd>
                            </div>
                        ))}

                        <div>
                            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Status</dt>
                            <dd>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cohort.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {cohort.isActive ? "Active" : "Inactive"}
                </span>
                            </dd>
                        </div>
                    </dl>
                ) : !error ? (
                    <p className="text-sm text-gray-400">Loading…</p>
                ) : null}
            </div>
        </div>
    );
}