"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// "lagos tech academy" → "lagos-tech-academy" (mirrors the backend's slugify).
export function slugify(name: string) {
  return name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
}

// The first step of sign-up, inline on the landing page: name the institution,
// see the address it will get, then continue to the full form.
export default function StartForm({ align = "left" }: { align?: "left" | "center" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const slug = slugify(name);

  function start(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (name.trim()) params.set("name", name.trim());
    if (slug) params.set("slug", slug);
    router.push(`/signup${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={start} className={`w-full max-w-xl ${align === "center" ? "mx-auto" : ""}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`start-${align}`}>Institution name</label>
        <input
          id={`start-${align}`}
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Your institution's name"
          className="h-12 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-400 shadow-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/15"
        />
        <button
          type="submit"
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30"
        >
          Create your institution
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>
      <p className={`mt-3 min-h-5 text-sm text-gray-500 ${align === "center" ? "text-center" : ""}`}>
        {slug ? (
          <>Your address: <span className="font-mono text-gray-800">cadence / {slug}</span></>
        ) : (
          <>Takes a minute. You&rsquo;ll be its owner and can invite your team straight away.</>
        )}
      </p>
    </form>
  );
}
