"use client";

import { useEffect, useState } from "react";
import { sessionApi, resumptionApi } from "@/lib/api";

interface Props {
  publicId: string;
  type: "session" | "resumption";
}

const PERIOD = 30;

export function LiveCodeDisplay({ publicId, type }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(PERIOD);
  const [error, setError] = useState<string | null>(null);

  async function fetchCode() {
    try {
      const res =
        type === "session"
          ? await sessionApi.getCurrentCode(publicId)
          : await resumptionApi.getCurrentCode(publicId);
      setCode(res.code);
      setSecondsRemaining(res.secondsRemaining);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch code");
    }
  }

  // Poll every 5 s — keeps the displayed code fresh even across rotations.
  useEffect(() => {
    fetchCode();
    const poll = setInterval(fetchCode, 5000);
    return () => clearInterval(poll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId, type]);

  // Tick down locally each second so the bar doesn't look frozen between polls.
  // Floors at 0; the next poll resets it to the server's authoritative value.
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  if (error) {
    return <p className="text-xs text-red-500">{error}</p>;
  }

  if (!code) {
    return <p className="text-xs text-gray-400 animate-pulse">Loading code…</p>;
  }

  const progress = secondsRemaining / PERIOD;
  const urgent = secondsRemaining <= 5;

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-3xl font-bold tracking-widest text-gray-900 select-all">
        {code}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: urgent ? "#ef4444" : "#3b82f6",
              transition: "width 1s linear, background-color 0.3s",
            }}
          />
        </div>
        <span
          className="text-xs tabular-nums w-8 text-right"
          style={{ color: urgent ? "#ef4444" : "#9ca3af" }}
        >
          {secondsRemaining}s
        </span>
      </div>
    </div>
  );
}
