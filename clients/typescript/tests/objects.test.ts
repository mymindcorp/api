import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type FetchFn,
  InvalidRequestError,
  MAX_BLOB_BYTES,
  MyMindClient,
  PayloadTooLargeError,
} from "../src/index.js";
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
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
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

function makeClient(fetchImpl: MockedFetch): MyMindClient {
  return new MyMindClient({
    kid: "kid1",
    secret: SECRET,
    userAgent: "TestApp/1.0",
    fetch: fetchImpl as unknown as FetchFn,
  });
}

describe("objects resource", () => {
  let fetchImpl: MockedFetch;
  let client: MyMindClient;

  beforeEach(() => {
    fetchImpl = vi.fn();
    client = makeClient(fetchImpl);
  });

  it("list returns flat array of objects", async () => {
    fetchImpl.mockResolvedValue(jsonResponse([OBJECT]));
    const result = await client.objects.list();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(OBJECT.id);
  });

  it("list with q= uses GET /objects", async () => {
    fetchImpl.mockResolvedValue(jsonResponse([]));
    await client.objects.list({ q: "tag:reading" });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("GET");
    expect(url).toContain("/objects");
  });

  it("list passes spaceId and similarTo as query params", async () => {
    fetchImpl.mockResolvedValue(jsonResponse([]));
    await client.objects.list({ spaceId: "spaceA", similarTo: "objB" });
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("spaceId=spaceA");
    expect(url).toContain("similarTo=objB");
  });

  it("create uses POST /objects with body", async () => {
    fetchImpl.mockResolvedValue(jsonResponse(OBJECT, 201));
    await client.objects.create({ url: "https://example.com", title: "Test" });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain("/objects");
    expect(JSON.parse(opts.body as string)).toMatchObject({
      url: "https://example.com",
      title: "Test",
    });
  });

  it("get uses GET /objects/:id", async () => {
    fetchImpl.mockResolvedValue(jsonResponse(OBJECT));
    await client.objects.get(OBJECT.id);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("GET");
    expect(url).toContain(`/objects/${OBJECT.id}`);
  });

  it("get forwards contentAs query param", async () => {
    fetchImpl.mockResolvedValue(jsonResponse(OBJECT));
    await client.objects.get(OBJECT.id, { contentAs: "text/markdown" });
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("contentAs=text%2Fmarkdown");
  });

  it("update uses PATCH /objects/:id", async () => {
    fetchImpl.mockResolvedValue(jsonResponse({}));
    await client.objects.update(OBJECT.id, { title: "Updated" });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("PATCH");
    expect(url).toContain(`/objects/${OBJECT.id}`);
  });

  it("delete uses DELETE /objects/:id", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.delete(OBJECT.id);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain(`/objects/${OBJECT.id}`);
  });

  it("restore uses POST /objects/:id/restore", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.restore(OBJECT.id);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain(`/objects/${OBJECT.id}/restore`);
  });

  it("addTags sends a {tags: [...]} body", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.addTags(OBJECT.id, [{ name: "reading" }]);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain(`/objects/${OBJECT.id}/tags`);
    expect(JSON.parse(opts.body as string)).toEqual({ tags: [{ name: "reading" }] });
  });

  it("removeTags sends a flat array body", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.removeTags(OBJECT.id, [{ name: "design" }, { id: "tagX" }]);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain(`/objects/${OBJECT.id}/tags`);
    expect(JSON.parse(opts.body as string)).toEqual([
      { name: "design" },
      { id: "tagX" },
    ]);
  });

  it("pin uses POST /objects/:id/pin", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.pin(OBJECT.id, { position: 0 });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain(`/objects/${OBJECT.id}/pin`);
    expect(JSON.parse(opts.body as string)).toMatchObject({ position: 0 });
  });

  it("unpin uses DELETE /objects/:id/pin", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.unpin(OBJECT.id);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain(`/objects/${OBJECT.id}/pin`);
  });

  it("addToSpaces uses POST /objects/:id/spaces with array body", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.addToSpaces(OBJECT.id, [{ id: "spaceA" }]);
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain(`/objects/${OBJECT.id}/spaces`);
    expect(JSON.parse(opts.body as string)).toEqual([{ id: "spaceA" }]);
  });

  it("addNote returns the assigned id and sets Content-Type from the discriminator", async () => {
    fetchImpl.mockResolvedValue(jsonResponse({ id: "n123" }, 201));
    const id = await client.objects.addNote(OBJECT.id, {
      type: "text/markdown",
      body: "hello",
    });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("POST");
    expect(url).toContain(`/objects/${OBJECT.id}/notes`);
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe(
      "text/markdown",
    );
    expect(opts.body).toBe("hello");
    expect(id).toBe("n123");
  });

  it("addNote JSON-stringifies a Prose body", async () => {
    fetchImpl.mockResolvedValue(jsonResponse({ id: "n123" }, 201));
    const prose = {
      type: "doc" as const,
      content: [{ type: "paragraph", content: [{ type: "text", text: "hi" }] }],
    };
    await client.objects.addNote(OBJECT.id, {
      type: "application/prose+json",
      body: prose,
    });
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/prose+json",
    );
    expect(opts.body).toBe(JSON.stringify(prose));
  });

  it("updateNote uses PUT and the right path", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.updateNote(OBJECT.id, "n123", {
      type: "text/markdown",
      body: "hi",
    });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("PUT");
    expect(url).toContain(`/objects/${OBJECT.id}/notes/n123`);
  });

  it("deleteNote uses DELETE", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.deleteNote(OBJECT.id, "n123");
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain(`/objects/${OBJECT.id}/notes/n123`);
  });

  it("updateContent uses PUT with the content type from the discriminator", async () => {
    fetchImpl.mockResolvedValue(emptyResponse());
    await client.objects.updateContent(OBJECT.id, {
      type: "text/markdown",
      body: "# new",
    });
    const [url, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe("PUT");
    expect(url).toContain(`/objects/${OBJECT.id}/content`);
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe(
      "text/markdown",
    );
    expect(opts.body).toBe("# new");
  });

  it("getContent with text/markdown returns a string", async () => {
    fetchImpl.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (k: string) => (k.toLowerCase() === "content-type" ? "text/markdown" : null),
      },
      text: () => Promise.resolve("# Hello\n"),
    } as unknown as Response);
    const out = await client.objects.getContent(OBJECT.id, "text/markdown");
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Accept"]).toBe("text/markdown");
    expect(out).toBe("# Hello\n");
  });

  it("getContent with application/prose+json returns a parsed Prose document", async () => {
    const prose = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "hi" }] }],
    };
    fetchImpl.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (k: string) =>
          k.toLowerCase() === "content-type" ? "application/prose+json" : null,
      },
      json: () => Promise.resolve(prose),
    } as unknown as Response);
    const out = await client.objects.getContent(OBJECT.id, "application/prose+json");
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Accept"]).toBe(
      "application/prose+json",
    );
    expect(out).toEqual(prose);
    expect(out).not.toBe("[object Object]");
  });

  it("getThumbnail builds /thumbnail with size= query and returns a Blob", async () => {
    fetchImpl.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (k: string) => (k === "Content-Type" ? "image/png" : null) },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as unknown as Response);
    const blob = await client.objects.getThumbnail(OBJECT.id, { size: "100x100" });
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain(`/objects/${OBJECT.id}/thumbnail`);
    expect(url).toContain("size=100x100");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(8);
  });

  it("getBlob returns a File when Content-Disposition has a filename", async () => {
    fetchImpl.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (k: string) => {
          const lc = k.toLowerCase();
          if (lc === "content-type") return "image/jpeg";
          if (lc === "content-disposition") return 'attachment; filename="sunset.jpg"';
          return null;
        },
      },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
    } as unknown as Response);
    const blob = await client.objects.getBlob(OBJECT.id);
    expect(blob).toBeInstanceOf(File);
    expect((blob as File).name).toBe("sunset.jpg");
    expect(blob.type).toBe("image/jpeg");
  });

  it("create rejects with InvalidRequestError when no source is provided", async () => {
    await expect(client.objects.create({})).rejects.toBeInstanceOf(InvalidRequestError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("create rejects with InvalidRequestError when more than one source is provided", async () => {
    await expect(
      client.objects.create({
        url: "https://example.com",
        content: "hello",
      }),
    ).rejects.toBeInstanceOf(InvalidRequestError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("create rejects with PayloadTooLargeError when the blob exceeds the cap", async () => {
    const oversized = { size: MAX_BLOB_BYTES + 1, type: "application/pdf" } as Blob;
    await expect(
      client.objects.create({ blob: oversized }),
    ).rejects.toBeInstanceOf(PayloadTooLargeError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("create with a File preserves the filename via FormData", async () => {
    fetchImpl.mockResolvedValue(jsonResponse(OBJECT, 201));
    const file = new File([new Uint8Array([1, 2, 3])], "sunset.jpg", {
      type: "image/jpeg",
    });
    await client.objects.create({ blob: file, title: "Sunset" });
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.body).toBeInstanceOf(FormData);
    const fd = opts.body as FormData;
    const blobPart = fd.get("blob");
    expect(blobPart).toBeInstanceOf(File);
    expect((blobPart as File).name).toBe("sunset.jpg");
    expect((blobPart as File).type).toBe("image/jpeg");
    expect(JSON.parse(await (fd.get("metadata") as Blob).text())).toMatchObject({
      title: "Sunset",
    });
  });
});
