import type { CourseMaterial } from "@/lib/api";

const isDrive = (url: string) => /^https?:\/\/(drive|docs)\.google\.com\//i.test(url);

export function materialKind(m: CourseMaterial): string {
  if (m.kind === "LINK") return isDrive(m.url) ? "Google Drive" : "Link";
  const t = m.contentType ?? "";
  if (t.startsWith("video/")) return "Video";
  if (t === "application/pdf") return "PDF";
  if (t.includes("presentation") || t.includes("powerpoint")) return "Slides";
  if (t.includes("word") || t.includes("document")) return "Document";
  if (t.startsWith("image/")) return "Image";
  return "File";
}

export function fileSize(bytes: number | null) {
  if (!bytes) return null;
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function Icon({ m }: { m: CourseMaterial }) {
  const kind = materialKind(m);
  const path =
    kind === "Video" ? <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>
      : kind === "Google Drive" || kind === "Link" ? <><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>
      : <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></>;
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
    </span>
  );
}

// One material: what it is, opened in a new tab.
export default function MaterialLink({ material }: { material: CourseMaterial }) {
  const meta = [materialKind(material), fileSize(material.sizeBytes)].filter(Boolean).join(" · ");
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon m={material} />
      <div className="min-w-0">
        <a href={material.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-medium text-blue-600 hover:underline">
          {material.title}
        </a>
        <p className="text-xs text-gray-400">{meta}</p>
        {material.note && <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-600">{material.note}</p>}
      </div>
    </div>
  );
}
