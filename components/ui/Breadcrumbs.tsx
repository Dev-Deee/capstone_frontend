import Link from "next/link";

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-300" aria-hidden="true">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-blue-600 hover:underline">{item.label}</Link>
          ) : (
            <span aria-current="page" className="text-gray-500">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
