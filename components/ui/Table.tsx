// Table primitives for list screens: quiet header, airy rows, hover, and an
// optional whole-row click (keyboard-accessible) for opening a detail page.
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, align = "left", className = "" }: { children?: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <th className={`whitespace-nowrap px-4 py-2.5 text-xs font-medium text-gray-400 ${align === "right" ? "text-right" : "text-left"} ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className = "" }: { children?: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${align === "right" ? "text-right" : ""} ${className}`}>{children}</td>;
}

export function Tr({ children, onOpen, muted = false }: { children: React.ReactNode; onOpen?: () => void; muted?: boolean }) {
  return (
    <tr
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => { if (e.key === "Enter") onOpen(); } : undefined}
      tabIndex={onOpen ? 0 : undefined}
      className={`border-t border-gray-100 transition-colors ${muted ? "opacity-60" : ""} ${
        onOpen ? "cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none" : ""
      }`}
    >
      {children}
    </tr>
  );
}
