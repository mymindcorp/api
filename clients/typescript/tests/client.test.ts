import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, MyMindClient, RateLimitedError } from "../src/index.js";

const SECRET = Buffer.alloc(16).toString("base64");

function mockFetch(
  body: unknown,
  status = 200,
  headers: Record<string, string | null> = {},
) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (k: string) => headers[k] ?? null,
    },
    json: () => Promise.resolve(body),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  });
}

describe("MyMindClient", () => {
  let client: MyMindClient;

  beforeEach(() => {
    client = new MyMindClient("kid1", SECRET, "TestApp/1.0", { bufferMs: 0 });
    vi.stubGlobal("fetch", mockFetch({ objects: [] }));
  });

  it("sends Authorization: Bearer <jwt> on every request", async () => {
    const spy = mockFetch({ objects: [] });
    vi.stubGlobal("fetch", spy);
    await client.objects.list();
    const [, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Authorization"]).toMatch(
      /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/,
    );
  });

  it("sends User-Agent on every request", async () => {
    const spy = mockFetch({ objects: [] });
    vi.stubGlobal("fetch", spy);
    await client.objects.list();
    const [, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["User-Agent"]).toBe(
      "TestApp/1.0",
    );
  });

  it("builds query string for list params", async () => {
    const spy = mockFetch({ objects: [] });
    vi.stubGlobal("fetch", spy);
    await client.objects.list({ q: "tag:reading", limit: 50 });
    const [url] = spy.mock.calls[0] as [string];
    expect(url).toContain("q=tag%3Areading");
    expect(url).toContain("limit=50");
  });

  it("repeats id= for multi-id fetch", async () => {
    const spy = mockFetch({ objects: [] });
    vi.stubGlobal("fetch", spy);
    await client.objects.list({ id: ["id1", "id2"] });
    const [url] = spy.mock.calls[0] as [string];
    expect(url).toContain("id=id1");
    expect(url).toContain("id=id2");
  });

  it("sets Content-Type: application/json for JSON bodies", async () => {
    const spy = mockFetch({ id: "abc", title: "t", tags: [], bumped: "", created: "", modified: "" });
    vi.stubGlobal("fetch", spy);
    await client.objects.create({ url: "https://example.com" });
    const [, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("throws ApiError for non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        { type: "https://api.mymind.com/errors/not-found", title: "Not found", status: 404, detail: "Object not found" },
        404,
        { "Content-Type": "application/problem+json" },
      ),
    );
    await expect(client.objects.get("nonexistent")).rejects.toThrow(ApiError);
  });

  it("includes status on ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        { type: "", title: "", status: 403, detail: "Forbidden" },
        403,
        { "Content-Type": "application/problem+json" },
      ),
    );
    await expect(client.objects.get("x")).rejects.toMatchObject({ status: 403 });
  });

  it("retries once after a 429 and succeeds", async () => {
    const rateLimitHeaders = { "RateLimit": "\"burst\";r=0;t=0", "Content-Type": "application/problem+json" };
    const fail = {
      ok: false,
      status: 429,
      headers: { get: (k: string) => (rateLimitHeaders as Record<string, string>)[k] ?? null },
      json: () => Promise.resolve({ type: "", title: "rate limited", status: 429, detail: "" }),
    };
    const succeed = {
      ok: true,
      status: 200,
      headers: { get: (k: string) => k.toLowerCase() === "content-type" ? "application/json" : null },
      json: () => Promise.resolve({ objects: [] }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(fail).mockResolvedValueOnce(succeed));
    // t=0 + bufferMs=0 → sleep(0ms), no fake timers needed
    await expect(client.objects.list()).resolves.toEqual([]);
  });

  it("throws RateLimitedError after exhausting retries", async () => {
    // maxRetries: 0 → throws on first 429, no sleep needed
    const noRetryClient = new MyMindClient("kid1", SECRET, "TestApp/1.0", { maxRetries: 0, bufferMs: 0 });
    const rateLimitHeaders = { "RateLimit": "\"burst\";r=0;t=1", "Content-Type": "application/problem+json" };
    const fail = {
      ok: false,
      status: 429,
      headers: { get: (k: string) => (rateLimitHeaders as Record<string, string>)[k] ?? null },
      json: () => Promise.resolve({ type: "", title: "rate limited", status: 429, detail: "" }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fail));
    await expect(noRetryClient.objects.list()).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("search passes all query params", async () => {
    const spy = mockFetch({ matches: [] });
    vi.stubGlobal("fetch", spy);
    await client.search({ q: "design", semantic: true, limit: 10 });
    const [url] = spy.mock.calls[0] as [string];
    expect(url).toContain("q=design");
    expect(url).toContain("semantic=true");
    expect(url).toContain("limit=10");
  });
});
