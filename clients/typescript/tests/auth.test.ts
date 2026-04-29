import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signRequest } from "../src/authentication/JwtSigner.js";

const KID = "testkey01";
// 16 zero bytes, base64-encoded
const SECRET = Buffer.alloc(16).toString("base64");

function decodeB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

describe("signRequest", () => {
  it("produces a three-segment JWT", async () => {
    const jwt = await signRequest(KID, SECRET, "GET", "/objects");
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);
  });

  it("header contains alg=HS256 and the supplied kid", async () => {
    const jwt = await signRequest(KID, SECRET, "GET", "/objects");
    const header = JSON.parse(decodeB64url(jwt.split(".")[0]).toString());
    expect(header.alg).toBe("HS256");
    expect(header.kid).toBe(KID);
  });

  it("payload encodes method, path, iat, and exp", async () => {
    const before = Math.floor(Date.now() / 1000);
    const jwt = await signRequest(KID, SECRET, "post", "/objects");
    const after = Math.floor(Date.now() / 1000);

    const payload = JSON.parse(decodeB64url(jwt.split(".")[1]).toString());
    expect(payload.method).toBe("POST");
    expect(payload.path).toBe("/objects");
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(after);
    expect(payload.exp).toBe(payload.iat + 300);
  });

  it("no base64 padding characters appear", async () => {
    const jwt = await signRequest(KID, SECRET, "GET", "/objects");
    expect(jwt).not.toMatch(/=/);
  });

  it("signature is valid HMAC-SHA256 over header.payload", async () => {
    const jwt = await signRequest(KID, SECRET, "GET", "/objects");
    const [header, payload, sig] = jwt.split(".");
    const expected = createHmac("sha256", Buffer.from(SECRET, "base64"))
      .update(`${header}.${payload}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(sig).toBe(expected);
  });

  it("different methods produce different signatures", async () => {
    const get = await signRequest(KID, SECRET, "GET", "/objects");
    const post = await signRequest(KID, SECRET, "POST", "/objects");
    expect(get.split(".")[2]).not.toBe(post.split(".")[2]);
  });

  it("different paths produce different signatures", async () => {
    const a = await signRequest(KID, SECRET, "GET", "/objects");
    const b = await signRequest(KID, SECRET, "GET", "/spaces");
    expect(a.split(".")[2]).not.toBe(b.split(".")[2]);
  });
});
