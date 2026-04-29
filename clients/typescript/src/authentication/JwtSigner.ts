import { base64url } from "../util.js";

/**
 * Generates a per-request HS256 JWT bound to the given HTTP method and path.
 * Uses the Web Crypto API (globalThis.crypto.subtle) — works natively on
 * Node 16+, Bun, Deno, and browsers with no imports.
 *
 * @param secret Base64-encoded 128-bit secret from the Extensions page.
 */
export async function signRequest(
  kid: string,
  secret: string,
  method: string,
  path: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(
    new TextEncoder().encode(JSON.stringify({ alg: "HS256", kid })),
  );
  const payload = base64url(
    new TextEncoder().encode(
      JSON.stringify({
        method: method.toUpperCase(),
        path,
        iat: now,
        exp: now + 300,
      }),
    ),
  );

  const signingInput = `${header}.${payload}`;
  const secretBytes = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(new Uint8Array(sig))}`;
}
