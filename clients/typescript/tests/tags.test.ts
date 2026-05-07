import { beforeEach, describe, expect, it, vi } from "vitest";
import { type FetchFn, MyMindClient, TagFlag } from "../src/index.js";
import type { Tag } from "../src/models/Tag.js";

const SECRET = Buffer.alloc(16).toString("base64");

const TAG: Tag = {
  name: "writing",
  count: 14,
  flags: TagFlag.Manual,
  modified: "2024-04-01T10:30:00Z",
};

type MockedFetch = ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (k: string) =>
        k.toLowerCase() === "content-type" ? "application/json" : null,
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as unknown as Response;
}

describe("tags resource", () => {
  let fetchImpl: MockedFetch;
  let client: MyMindClient;

  beforeEach(() => {
    fetchImpl = vi.fn();
    client = new MyMindClient({
      kid: "kid1",
      secret: SECRET,
      userAgent: "TestApp/1.0",
      fetch: fetchImpl as unknown as FetchFn,
    });
  });

  it("list uses GET /tags and returns Tag[]", async () => {
    fetchImpl.mockResolvedValue(jsonResponse([TAG]));
    const tags = await client.tags.list();
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("GET");
    expect(url).toContain("/tags");
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe(TAG.name);
  });

  it("list passes limit as query param", async () => {
    fetchImpl.mockResolvedValue(jsonResponse([]));
    await client.tags.list({ limit: 500 });
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("limit=500");
  });

  it("forwards an AbortSignal through to fetch", async () => {
    fetchImpl.mockResolvedValue(jsonResponse([]));
    const ctrl = new AbortController();
    await client.tags.list(undefined, { signal: ctrl.signal });
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.signal).toBe(ctrl.signal);
  });
});
