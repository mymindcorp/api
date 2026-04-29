import { beforeEach, describe, expect, it, vi } from "vitest";
import { MyMindClient } from "../src/index.js";
import type { MindObject } from "../src/models/MindObject.js";

const SECRET = Buffer.alloc(16).toString("base64");

const OBJECT: MindObject = {
  id: "a1B2c3D4e5F6g7H8i9J0k1",
  title: "Example",
  tags: [],
  bumped: "2024-01-01T00:00:00Z",
  created: "2024-01-01T00:00:00Z",
  modified: "2024-01-01T00:00:00Z",
};

const jsonHeaders = { get: (k: string) => k.toLowerCase() === "content-type" ? "application/json" : null };

function stubFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers: jsonHeaders,
      json: () => Promise.resolve(body),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
    }),
  );
}

describe("objects resource", () => {
  let client: MyMindClient;

  beforeEach(() => {
    client = new MyMindClient("kid1", SECRET, "TestApp/1.0");
  });

  it("list returns object array", async () => {
    stubFetch({ objects: [OBJECT] });
    const result = await client.objects.list();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(OBJECT.id);
  });

  it("list with q= uses GET /objects", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, headers: jsonHeaders, json: () => Promise.resolve({ objects: [] }) });
    vi.stubGlobal("fetch", spy);
    await client.objects.list({ q: "tag:reading" });
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("GET");
    expect(url).toContain("/objects");
  });

  it("create uses POST /objects with body", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 201, headers: jsonHeaders, json: () => Promise.resolve(OBJECT) });
    vi.stubGlobal("fetch", spy);
    await client.objects.create({ url: "https://example.com", title: "Test" });
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain("/objects");
    expect(JSON.parse(opts.body as string)).toMatchObject({ url: "https://example.com", title: "Test" });
  });

  it("get uses GET /objects/:id", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, headers: jsonHeaders, json: () => Promise.resolve(OBJECT) });
    vi.stubGlobal("fetch", spy);
    await client.objects.get(OBJECT.id);
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("GET");
    expect(url).toContain(`/objects/${OBJECT.id}`);
  });

  it("update uses PATCH /objects/:id", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, headers: jsonHeaders, json: () => Promise.resolve(OBJECT) });
    vi.stubGlobal("fetch", spy);
    await client.objects.update(OBJECT.id, { title: "Updated" });
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("PATCH");
    expect(url).toContain(`/objects/${OBJECT.id}`);
  });

  it("delete uses DELETE /objects/:id", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 204, headers: { get: () => null }, json: () => Promise.resolve(null) });
    vi.stubGlobal("fetch", spy);
    await client.objects.delete(OBJECT.id);
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain(`/objects/${OBJECT.id}`);
  });

  it("restore uses POST /objects/:id/restore", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 204, headers: { get: () => null }, json: () => Promise.resolve(null) });
    vi.stubGlobal("fetch", spy);
    await client.objects.restore(OBJECT.id);
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain(`/objects/${OBJECT.id}/restore`);
  });

  it("tag sends tags array", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 204, headers: { get: () => null }, json: () => Promise.resolve(null) });
    vi.stubGlobal("fetch", spy);
    await client.objects.tag(OBJECT.id, [{ name: "reading" }]);
    const [, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(opts.body as string)).toEqual({ tags: [{ name: "reading" }] });
  });

  it("pin uses POST /objects/:id/pin", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 204, headers: { get: () => null }, json: () => Promise.resolve(null) });
    vi.stubGlobal("fetch", spy);
    await client.objects.pin(OBJECT.id, { position: 0 });
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain(`/objects/${OBJECT.id}/pin`);
    expect(JSON.parse(opts.body as string)).toMatchObject({ position: 0 });
  });

  it("unpin uses DELETE /objects/:id/pin", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 204, headers: { get: () => null }, json: () => Promise.resolve(null) });
    vi.stubGlobal("fetch", spy);
    await client.objects.unpin(OBJECT.id);
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain(`/objects/${OBJECT.id}/pin`);
  });

  it("related returns match array", async () => {
    stubFetch({ matches: [{ id: "x", score: 0.9 }] });
    const matches = await client.objects.related(OBJECT.id);
    expect(matches[0].id).toBe("x");
  });

  it("addToSpaces uses POST /objects/:id/spaces", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 204, headers: { get: () => null }, json: () => Promise.resolve(null) });
    vi.stubGlobal("fetch", spy);
    await client.objects.addToSpaces(OBJECT.id, [{ id: "spaceA" }]);
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain(`/objects/${OBJECT.id}/spaces`);
    expect(JSON.parse(opts.body as string)).toEqual([{ id: "spaceA" }]);
  });
});
