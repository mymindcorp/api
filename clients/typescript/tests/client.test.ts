import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  type FetchFn,
  ForbiddenError,
  InternalServerError,
  InvalidRequestError,
  MyMindClient,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitedError,
  type RetryPolicy,
  ServiceUnavailableError,
  UnauthorizedError,
  UnprocessableError,
} from "../src/index.js";

const SECRET = Buffer.alloc(16).toString("base64");

type MockedFetch = ReturnType<typeof vi.fn>;

function makeResponse(opts: {
  body?: unknown;
  status?: number;
  headers?: Record<string, string>;
}): Response {
  const status = opts.status ?? 200;
  const headers = opts.headers ?? { "Content-Type": "application/json" };
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (k: string) => headers[k] ?? headers[k.toLowerCase()] ?? null,
    },
    json: () => Promise.resolve(opts.body),
    text: () =>
      Promise.resolve(
        typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body),
      ),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as unknown as Response;
}

function makeClient(
  fetchImpl: MockedFetch,
  retryPolicy: Partial<RetryPolicy> = { bufferMs: 0, initialBackoffMs: 0 },
) {
  return new MyMindClient({
    kid: "kid1",
    secret: SECRET,
    userAgent: "TestApp/1.0",
    fetch: fetchImpl as unknown as FetchFn,
    retryPolicy,
  });
}

describe("MyMindClient", () => {
  let fetchImpl: MockedFetch;
  let client: MyMindClient;

  beforeEach(() => {
    fetchImpl = vi.fn();
    client = makeClient(fetchImpl);
  });

  it("sends Authorization: Bearer <jwt> on every request", async () => {
    fetchImpl.mockResolvedValue(makeResponse({ body: [] }));
    await client.objects.list();
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Authorization"]).toMatch(
      /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/,
    );
  });

  it("sends User-Agent on every request", async () => {
    fetchImpl.mockResolvedValue(makeResponse({ body: [] }));
    await client.objects.list();
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["User-Agent"]).toBe(
      "TestApp/1.0",
    );
  });

  it("builds query string for list params", async () => {
    fetchImpl.mockResolvedValue(makeResponse({ body: [] }));
    await client.objects.list({ q: "tag:reading", limit: 50 });
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("q=tag%3Areading");
    expect(url).toContain("limit=50");
  });

  it("repeats id= for multi-id fetch", async () => {
    fetchImpl.mockResolvedValue(makeResponse({ body: [] }));
    await client.objects.list({ id: ["id1", "id2"] });
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("id=id1");
    expect(url).toContain("id=id2");
  });

  it("sets Content-Type: application/json for JSON bodies", async () => {
    fetchImpl.mockResolvedValue(
      makeResponse({
        body: { id: "abc", title: "t", tags: [], bumped: "", created: "", modified: "" },
      }),
    );
    await client.objects.create({ url: "https://example.com" });
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("throws ApiError for non-2xx responses", async () => {
    fetchImpl.mockResolvedValue(
      makeResponse({
        status: 404,
        body: { type: "NotFound", status: 404, detail: "Object not found" },
        headers: { "Content-Type": "application/problem+json" },
      }),
    );
    await expect(client.objects.get("nonexistent")).rejects.toThrow(ApiError);
  });

  it("includes status on ApiError", async () => {
    fetchImpl.mockResolvedValue(
      makeResponse({
        status: 403,
        body: { type: "Forbidden", status: 403, detail: "Forbidden" },
        headers: { "Content-Type": "application/problem+json" },
      }),
    );
    await expect(client.objects.get("x")).rejects.toMatchObject({ status: 403 });
  });

  it("retries once after a 429 and succeeds", async () => {
    fetchImpl
      .mockResolvedValueOnce(
        makeResponse({
          status: 429,
          body: { type: "RateLimited", status: 429, detail: "" },
          headers: {
            RateLimit: '"burst";r=0;t=0',
            "Content-Type": "application/problem+json",
          },
        }),
      )
      .mockResolvedValueOnce(makeResponse({ body: [] }));
    await expect(client.objects.list()).resolves.toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("throws RateLimitedError after exhausting retries", async () => {
    const noRetry = makeClient(fetchImpl, { maxRetries: 0, bufferMs: 0 });
    fetchImpl.mockResolvedValue(
      makeResponse({
        status: 429,
        body: { type: "RateLimited", status: 429, detail: "" },
        headers: {
          RateLimit: '"burst";r=0;t=1',
          "Content-Type": "application/problem+json",
        },
      }),
    );
    await expect(noRetry.objects.list()).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("retries 500 with exponential backoff", async () => {
    fetchImpl
      .mockResolvedValueOnce(
        makeResponse({
          status: 500,
          body: { type: "InternalServerError", status: 500, detail: "" },
        }),
      )
      .mockResolvedValueOnce(makeResponse({ body: [] }));
    await expect(client.objects.list()).resolves.toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("rethrows InternalServerError once retries are exhausted", async () => {
    const noRetry = makeClient(fetchImpl, { maxRetries: 0 });
    fetchImpl.mockResolvedValue(
      makeResponse({
        status: 500,
        body: { type: "InternalServerError", status: 500, detail: "" },
      }),
    );
    await expect(noRetry.objects.list()).rejects.toBeInstanceOf(InternalServerError);
  });

  it("uses an injected base URL", async () => {
    fetchImpl.mockResolvedValue(makeResponse({ body: [] }));
    const customClient = new MyMindClient({
      kid: "kid1",
      secret: SECRET,
      userAgent: "TestApp/1.0",
      baseUrl: "https://staging.example.com",
      fetch: fetchImpl as unknown as FetchFn,
    });
    await customClient.objects.list();
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url.startsWith("https://staging.example.com/")).toBe(true);
  });

  it("forwards an AbortSignal through to fetch", async () => {
    fetchImpl.mockResolvedValue(makeResponse({ body: [] }));
    const ctrl = new AbortController();
    await client.objects.list(undefined, { signal: ctrl.signal });
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(opts.signal).toBe(ctrl.signal);
  });

  it("rejects immediately if the signal is already aborted", async () => {
    const ctrl = new AbortController();
    ctrl.abort(new Error("nope"));
    await expect(
      client.objects.list(undefined, { signal: ctrl.signal }),
    ).rejects.toThrow("nope");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("search passes all query params", async () => {
    fetchImpl.mockResolvedValue(makeResponse({ body: { matches: [] } }));
    await client.search({ q: "design", semantic: true, limit: 10 });
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("q=design");
    expect(url).toContain("semantic=true");
    expect(url).toContain("limit=10");
  });

  it("convert sends Content-Type and Accept headers, raw string body for text", async () => {
    fetchImpl.mockResolvedValue(
      makeResponse({
        body: "# Heading\n",
        headers: { "Content-Type": "text/markdown" },
      }),
    );
    const out = await client.convert({
      source: { type: "text/plain", body: "hello" },
      targetType: "text/markdown",
    });
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe("text/plain");
    expect((opts.headers as Record<string, string>)["Accept"]).toBe("text/markdown");
    expect(opts.body).toBe("hello");
    expect(out).toBe("# Heading\n");
  });

  describe("status → error class dispatch", () => {
    const cases = [
      { status: 400, expected: InvalidRequestError, type: "BadRequest" },
      { status: 401, expected: UnauthorizedError, type: "Unauthorized" },
      { status: 403, expected: ForbiddenError, type: "Forbidden" },
      { status: 404, expected: NotFoundError, type: "NotFound" },
      { status: 413, expected: PayloadTooLargeError, type: "PayloadTooLarge" },
      { status: 422, expected: UnprocessableError, type: "Unprocessable" },
      { status: 429, expected: RateLimitedError, type: "RateLimited" },
      { status: 500, expected: InternalServerError, type: "InternalServerError" },
      { status: 503, expected: ServiceUnavailableError, type: "Unavailable" },
    ];

    for (const { status, expected, type } of cases) {
      it(`maps ${status} to ${expected.name}`, async () => {
        const noRetry = makeClient(fetchImpl, { maxRetries: 0, bufferMs: 0 });
        fetchImpl.mockResolvedValue(
          makeResponse({
            status,
            body: { type, status, detail: "" },
            headers: {
              "Content-Type": "application/problem+json",
              ...(status === 429 ? { RateLimit: '"burst";r=0;t=0' } : {}),
            },
          }),
        );
        await expect(noRetry.objects.get("x")).rejects.toBeInstanceOf(expected);
        await expect(noRetry.objects.get("x")).rejects.toBeInstanceOf(ApiError);
      });
    }

    it("falls back to ApiError for an unmapped status", async () => {
      const noRetry = makeClient(fetchImpl, { maxRetries: 0 });
      fetchImpl.mockResolvedValue(
        makeResponse({
          status: 418,
          body: { type: "Teapot", status: 418, detail: "I'm a teapot" },
          headers: { "Content-Type": "application/problem+json" },
        }),
      );
      const err = await noRetry.objects.get("x").catch((e) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.constructor.name).toBe("ApiError");
      expect(err.status).toBe(418);
    });
  });

  it("convert JSON-stringifies a Prose source body", async () => {
    fetchImpl.mockResolvedValue(
      makeResponse({
        body: "# Heading\n",
        headers: { "Content-Type": "text/markdown" },
      }),
    );
    const prose = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "hi" }] }],
    } as const;
    await client.convert({
      source: { type: "application/prose+json", body: prose },
      targetType: "text/markdown",
    });
    const [, opts] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/prose+json",
    );
    expect(opts.body).toBe(JSON.stringify(prose));
  });
});
