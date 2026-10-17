"use client";

// Above a list: the count, segment tabs (each with its own count), search,
// and any extra controls on the right.
export interface Segment<T extends string> { value: T; label: string; count?: number }

export default function ListToolbar<T extends string>({
  count, noun, segments, segment, onSegment, search, onSearch, searchPlaceholder = "Search…", children,
}: {
  count: number;
  noun: string;
  segments?: Segment<T>[];
  segment?: T;
  onSegment?: (v: T) => void;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-gray-100 px-4 py-3">
      <p className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-gray-900">{count}</span>
        <span className="text-sm text-gray-500">{noun}</span>
      </p>
      {segments && onSegment && (
        <div className="flex flex-wrap gap-1" role="tablist">
          {segments.map((s) => (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={segment === s.value}
              onClick={() => onSegment(s.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                segment === s.value ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {s.label}
              {s.count != null && <span className="ml-1.5 text-gray-400">{s.count}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        {onSearch && (
          <label className="relative">
            <span className="sr-only">Search</span>
            <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-56 rounded-lg border border-gray-200 bg-surface py-1.5 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        )}
      </div>
    </div>
  );
}
