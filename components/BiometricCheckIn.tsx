"use client";

import { useState } from "react";
import type { BiometricChallenge, CheckInAssertion, CheckInRecord } from "@/lib/api";
import { BiometricError, signCheckIn } from "@/lib/webauthn";

type Phase = "ready" | "working" | "cancelled" | "unavailable" | "rejected" | "network";

const NOTE: Record<Exclude<Phase, "ready" | "working">, string> = {
  cancelled: "Fingerprint / Face ID was cancelled or timed out. Your code is saved — try again.",
  unavailable: "This device couldn't run fingerprint / Face ID. Your code is saved — try again, or ask your facilitator to mark you present.",
  rejected: "We couldn't confirm it was you on this device. Try again, or ask your facilitator to mark you present.",
  network: "Connection problem — your code is saved. Try again when you're back online.",
};

// PRD Section 6.12 — the step after the code is accepted, for students with
// biometrics set up. The check-in stays "awaiting biometric" (not attendance)
// until this succeeds or a facilitator settles it with a manual override.
// The prompt needs a tap to start (browsers require a user gesture for it).
export default function BiometricCheckIn({
  record,
  reissue,
  confirm,
  onDone,
}: {
  record: CheckInRecord;
  reissue: (recordPublicId: string) => Promise<BiometricChallenge>;
  confirm: (recordPublicId: string, assertion: CheckInAssertion) => Promise<CheckInRecord>;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("ready");
  // The first attempt uses the challenge that came with the check-in; every
  // retry asks for a fresh one (challenges are single-use).
  const [challenge, setChallenge] = useState<BiometricChallenge | null>(record.biometric);

  async function attempt() {
    setPhase("working");
    let c = challenge;
    try {
      if (!c) c = await reissue(record.publicId);
    } catch (err) {
      setPhase(err instanceof TypeError ? "network" : "rejected");
      return;
    }
    setChallenge(null);

    let assertion: CheckInAssertion;
    try {
      assertion = await signCheckIn(c);
    } catch (err) {
      setPhase(err instanceof BiometricError ? err.kind : "unavailable");
      return;
    }

    try {
      await confirm(record.publicId, assertion);
      onDone();
    } catch (err) {
      setPhase(err instanceof TypeError ? "network" : "rejected");
    }
  }

  const note = phase === "ready" || phase === "working" ? null : NOTE[phase];

  return (
    <div className="space-y-3">
      <div className="text-sm rounded-lg px-3 py-2 border bg-blue-50 text-blue-800 border-blue-100">
        Code accepted. Confirm it&apos;s you with your fingerprint or Face ID to finish checking in.
      </div>
      {note && (
        <div className="text-sm rounded-lg px-3 py-2 border bg-amber-50 text-amber-800 border-amber-100">{note}</div>
      )}
      <button
        type="button"
        onClick={attempt}
        disabled={phase === "working"}
        className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {phase === "working" ? "Waiting for your device…" : phase === "ready" ? "Confirm with fingerprint / Face ID" : "Try again"}
      </button>
      <p className="text-xs text-gray-400">
        Your fingerprint or face never leaves your device — Cadence only receives a signed confirmation.
      </p>
    </div>
  );
}
