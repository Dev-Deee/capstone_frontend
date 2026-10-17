"use client";

export type TabItem = { id: string; label: string; live?: boolean };

// The tab strip shared by every tabbed page. `live` adds a green dot so an
// open session on a background tab isn't forgotten.
export default function TabBar({ tabs, active, onChange }: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 mb-6 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_theme(colors.gray.200)]" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            active === t.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          {t.label}
          {t.live && <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-label="live" />}
        </button>
      ))}
    </div>
  );
}
