"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TabBar from "@/components/TabBar";
import PageHeader from "@/components/PageHeader";

export type Tab = { id: string; label: string; content: ReactNode };

// Page title + tab bar, with the active tab kept in ?tab= so links and
// redirects from the old standalone pages can land on a specific tab.
type Props = { title: string; description?: string; eyebrow?: string; tabs: Tab[] };

function Tabs({ title, description, eyebrow, tabs }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const requested = useSearchParams().get("tab");
  const active = tabs.find((t) => t.id === requested) ?? tabs[0];

  return (
    <div className="p-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <TabBar
        tabs={tabs}
        active={active.id}
        onChange={(id) => router.replace(`${pathname}?tab=${id}`)}
      />
      {active.content}
    </div>
  );
}

export default function TabbedPage(props: Props) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading…</div>}>
      <Tabs {...props} />
    </Suspense>
  );
}
