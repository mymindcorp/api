import { beforeEach, describe, expect, it, vi } from "vitest";
import { type FetchFn, MyMindClient } from "../src/index.js";
import type { Space } from "../src/models/Space.js";

const SECRET = Buffer.alloc(16).toString("base64");

const SPACE: Space = {
  id: "j5K6l7M8n9O0p1Q2r3S4t5",
  name: "Design research",
  color: "#e0f2fe",
  created: "2024-04-08T09:00:00Z",
  objects: [],
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

function emptyResponse(): Response {
  return {
    ok: true,
    status: 204,
    headers: { get: () => null },
    json: () => Promise.resolve(null),
    text: () => Promise.resolve(""),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as unknown as Response;
}

describe("spaces resource", () => {
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

  it("list uses GET /spaces and returns Space[]", async () => {
    fetchImpl.mockResolvedValue(jsonResponse([SPACE]));
    const spaces = await client.spaces.list();
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("GET");
    expect(url).toContain("/spaces");
    expect(spaces).toHaveLength(1);
    expect(spaces[0].id).toBe(SPACE.id);
  });

  it("create uses POST /spaces with body", async () => {
    fetchImpl.mockResolvedValue(jsonResponse(SPACE, 201));
    await client.spaces.create({ name: "Design research", color: "#e0f2fe" });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain("/spaces");
    expect(JSON.parse(opts.body as string)).toEqual({
      name: "Design research",
      color: "#e0f2fe",
    });
  });

  it("get uses GET /spaces/:id", async () => {
    fetchImpl.mockResolvedValue(jsonResponse(SPACE));
    await client.spaces.get(SPACE.id);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("GET");
    expect(url).toContain(`/spaces/${SPACE.id}`);
  });

  it("update uses PATCH /spaces/:id with body", async () => {
    fetchImpl.mockResolvedValue(jsonResponse(SPACE));
    await client.spaces.update(SPACE.id, { name: "Travel inspiration" });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("PATCH");
    expect(url).toContain(`/spaces/${SPACE.id}`);
    expect(JSON.parse(opts.body as string)).toEqual({ name: "Travel inspiration" });
  });

  it("delete uses DELETE /spaces/:id", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.spaces.delete(SPACE.id);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain(`/spaces/${SPACE.id}`);
  });

  it("addObject uses PUT /spaces/:spaceId/objects/:objectId", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.spaces.addObject(SPACE.id, "objA");
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("PUT");
    expect(url).toContain(`/spaces/${SPACE.id}/objects/objA`);
  });

  it("removeObject uses DELETE /spaces/:spaceId/objects/:objectId", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.spaces.removeObject(SPACE.id, "objA");
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain(`/spaces/${SPACE.id}/objects/objA`);
  });

  it("forwards an AbortSignal through to fetch", async () => {
    fetchImpl.mockResolvedValue(jsonResponse([]));
    const ctrl = new AbortController();
    await client.spaces.list({ signal: ctrl.signal });
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.signal).toBe(ctrl.signal);
  });
});
