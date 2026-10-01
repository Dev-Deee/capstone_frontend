import { authApi } from "./api";

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
