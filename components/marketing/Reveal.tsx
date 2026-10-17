"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Fades content up as it scrolls into view. Server HTML is always visible: only
// elements still below the fold after hydration are hidden, then revealed when
// they enter the viewport — so there's no flash and nothing hides if JS fails.
export default function Reveal({
  children, delay = 0, className = "", as: Tag = "div",
}: { children: ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already in view
    el.classList.add("reveal-pending");
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.style.transitionDelay = `${delay}ms`;
      el.classList.add("reveal-in");
      el.classList.remove("reveal-pending");
      io.disconnect();
    }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>{children}</Tag>
  );
}
