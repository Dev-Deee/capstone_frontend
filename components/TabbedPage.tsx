"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TabBar from "@/components/TabBar";

export type Tab = { id: string; label: string; content: ReactNode };

// Page title + tab bar, with the active tab kept in ?tab= so links and
// redirects from the old standalone pages can land on a specific tab.
function Tabs({ title, tabs }: { title: string; tabs: Tab[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const requested = useSearchParams().get("tab");
  const active = tabs.find((t) => t.id === requested) ?? tabs[0];

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">{title}</h1>
      <TabBar
        tabs={tabs}
        active={active.id}
        onChange={(id) => router.replace(`${pathname}?tab=${id}`)}
      />
      {active.content}
    </div>
  );
}

export default function TabbedPage(props: { title: string; tabs: Tab[] }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading…</div>}>
      <Tabs {...props} />
    </Suspense>
  );
}
