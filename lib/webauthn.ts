import type { BiometricChallenge, CheckInAssertion } from "./api";

function bufferToBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}

export async function registerBiometric(deviceLabel: string) {
  const optionsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/webauthn/register/options`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("cadence_access_token")}` },
  });
  const options = await optionsRes.json();

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: base64UrlToBuffer(options.challenge),
      rp: { id: options.rpId, name: options.rpName },
      user: {
        id: base64UrlToBuffer(btoa(options.userId)),
        name: options.userName,
        displayName: options.userName,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
    },
  })) as PublicKeyCredential;

  const response = credential.response as AuthenticatorAttestationResponse;

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/webauthn/register/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("cadence_access_token")}`,
    },
    body: JSON.stringify({
      credentialId: bufferToBase64Url(credential.rawId),
      attestationObject: bufferToBase64Url(response.attestationObject),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      deviceLabel,
    }),
  });
}

// PRD Section 6.12 — the biometric step of check-in. The fingerprint / Face ID
// match happens on the device; only the signed assertion leaves it.
//
// "cancelled": NotAllowedError. Browsers deliberately report a dismissed prompt,
// a timeout, and "no credential for this site on this device" the same way, so
// these can't be told apart — all are worth a retry, then the facilitator.
// "unavailable": anything else (no WebAuthn support, security/state errors) —
// a retry rarely helps; the facilitator's manual override is the way through.
export class BiometricError extends Error {
  constructor(public kind: "cancelled" | "unavailable") {
    super(kind === "cancelled" ? "Fingerprint / Face ID was cancelled" : "This device couldn't run fingerprint / Face ID");
  }
}

export async function signCheckIn(c: BiometricChallenge): Promise<CheckInAssertion> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) throw new BiometricError("unavailable");
  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.get({
      publicKey: {
        challenge: base64UrlToBuffer(c.challenge),
        rpId: c.rpId,
        allowCredentials: c.credentialIds.map((id) => ({ type: "public-key" as const, id: base64UrlToBuffer(id) })),
        userVerification: "required",
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
  } catch (err) {
    if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "AbortError")) {
      throw new BiometricError("cancelled");
    }
    throw new BiometricError("unavailable");
  }
  if (!credential) throw new BiometricError("cancelled");
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    credentialId: bufferToBase64Url(credential.rawId),
    authenticatorData: bufferToBase64Url(response.authenticatorData),
    clientDataJSON: bufferToBase64Url(response.clientDataJSON),
    signature: bufferToBase64Url(response.signature),
  };
}
