import { signRequest } from "./authentication/JwtSigner.js";
import {
  ApiError,
  ForbiddenError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitedError,
  ServiceUnavailableError,
  UnauthorizedError,
  UnprocessableError,
} from "./exceptions/index.js";
import type { Problem } from "./models/Problem.js";
import { parseStateHeader } from "./ratelimiting/RateLimitHeaders.js";
import type { RateLimitState } from "./ratelimiting/RateLimitState.js";
import { defaultRetryPolicy, type RetryPolicy } from "./ratelimiting/RetryPolicy.js";
import { sleep } from "./util.js";

/** Default API base URL. */
export const DEFAULT_BASE_URL = "https://api.mymind.com";

/** Maximum upload size (64 MB). The server returns 413 above this. */
export const MAX_BLOB_BYTES = 64 * 1024 * 1024;

/** Cancellation knob accepted by every service method. */
export interface RequestOptions {
  /** AbortSignal that aborts the in-flight request and any retry sleeps. */
  signal?: AbortSignal;
}

/** Fetch implementation accepted by `ApiClient`. Defaults to `globalThis.fetch`. */
export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Constructor options for {@link ApiClient}.
 * @internal
 */
export interface ApiClientOptions {
  kid: string;
  secret: string;
  userAgent: string;
  /** Override the API base URL — useful for testing or staging. */
  baseUrl?: string;
  /** Override the underlying `fetch` — useful for testing or DI. */
  fetch?: FetchFn;
  /** Rate-limit retry policy overrides. */
  retryPolicy?: Partial<RetryPolicy>;
}

/**
 * Primitive values accepted as query-string parameters.
 * @internal
 */
export type QueryValue = string | string[] | number | boolean | undefined;

/** @internal */
export interface DispatchOptions {
  method: string;
  path: string;
  query?: Record<string, QueryValue>;
  /** A value to JSON-serialize as the request body. */
  body?: unknown;
  /** Pre-encoded request body (FormData, ArrayBuffer, string, …). */
  rawBody?: BodyInit;
  headers?: Record<string, string>;
  /** Cancellation signal forwarded to `fetch` and to retry sleeps. */
  signal?: AbortSignal;
}

/**
 * Low-level HTTP client. Handles JWT signing, rate-limit-aware retry,
 * 5xx exponential backoff, cancellation, and content-type-aware response
 * decoding. Most callers should go through `MyMindClient` and the
 * resource services.
 * @internal
 */
export class ApiClient {
  private readonly kid: string;
  private readonly secret: string;
  private readonly userAgent: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchFn;
  private readonly retryPolicy: RetryPolicy;
  private nextAllowedAt = 0;

  constructor(options: ApiClientOptions) {
    this.kid = options.kid;
    this.secret = options.secret;
    this.userAgent = options.userAgent;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetch ?? ((url, init) => globalThis.fetch(url, init));
    this.retryPolicy = { ...defaultRetryPolicy, ...options.retryPolicy };
  }

  /**
   * Sends a request and decodes the response based on its `Content-Type`:
   * JSON for `application/*+json`, a string for `text/*`, an `ArrayBuffer`
   * for everything else, and `undefined` for empty responses.
   */
  async send<T>(opts: DispatchOptions): Promise<T> {
    return this.run(opts, async (res) => {
      if (res.status === 204) return undefined as T;
      const ct = res.headers.get("Content-Type") ?? "";
      if (isJson(ct)) return (await res.json()) as T;
      if (ct.startsWith("text/")) return (await res.text()) as unknown as T;
      return (await res.arrayBuffer()) as unknown as T;
    });
  }

  /**
   * Sends a request and returns the response as a standard `Blob`.
   * When the response carries a `Content-Disposition` filename, returns a
   * `File` (a `Blob` subclass) carrying the name — callers can `instanceof
   * File` to access `.name`.
   */
  async download(opts: DispatchOptions): Promise<Blob> {
    return this.run(opts, async (res) => {
      const buffer = await res.arrayBuffer();
      const type = res.headers.get("Content-Type") ?? "application/octet-stream";
      const filename = parseFilename(res.headers.get("Content-Disposition"));
      return filename
        ? new File([buffer], filename, { type })
        : new Blob([buffer], { type });
    });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async run<T>(
    opts: DispatchOptions,
    parse: (res: Response) => Promise<T>,
  ): Promise<T> {
    const { maxRetries, bufferMs, initialBackoffMs, maxBackoffMs } = this.retryPolicy;
    let attempt = 0;
    while (true) {
      throwIfAborted(opts.signal);
      await this.waitForQuota(opts.signal);
      try {
        return await this.dispatch(opts, parse);
      } catch (err) {
        if (attempt >= maxRetries) throw err;

        if (err instanceof RateLimitedError) {
          const slowest = Math.max(
            0,
            ...err.states.filter((s) => s.remaining === 0).map((s) => s.resetSeconds),
          );
          await sleep(slowest * 1000 + bufferMs, opts.signal);
        } else if (
          err instanceof InternalServerError ||
          err instanceof ServiceUnavailableError
        ) {
          const backoff = Math.min(initialBackoffMs * 2 ** attempt, maxBackoffMs);
          await sleep(backoff, opts.signal);
        } else {
          throw err;
        }
        attempt++;
      }
    }
  }

  private async waitForQuota(signal?: AbortSignal): Promise<void> {
    const delay = this.nextAllowedAt - Date.now();
    if (delay > 0) await sleep(delay, signal);
  }

  private recordRateLimit(states: RateLimitState[]): void {
    const slowest = Math.max(
      0,
      ...states.filter((s) => s.remaining === 0).map((s) => s.resetSeconds),
    );
    if (slowest <= 0) return;
    const resumeAt = Date.now() + slowest * 1000 + this.retryPolicy.bufferMs;
    if (resumeAt > this.nextAllowedAt) this.nextAllowedAt = resumeAt;
  }

  private async dispatch<T>(
    opts: DispatchOptions,
    parse: (res: Response) => Promise<T>,
  ): Promise<T> {
    const url = new URL(opts.path, this.baseUrl);

    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v === undefined) continue;
        if (Array.isArray(v)) {
          for (const item of v) url.searchParams.append(k, String(item));
        } else {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const token = await signRequest(this.kid, this.secret, opts.method, opts.path);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "User-Agent": this.userAgent,
      ...opts.headers,
    };

    let body: BodyInit | undefined;
    if (opts.rawBody !== undefined) {
      body = opts.rawBody;
    } else if (opts.body !== undefined) {
      headers["Content-Type"] ??= "application/json";
      body = JSON.stringify(opts.body);
    }

    const res = await this.fetchImpl(url.toString(), {
      method: opts.method,
      headers,
      body,
      redirect: "follow",
      signal: opts.signal,
    });

    const states = parseStateHeader(res.headers.get("RateLimit"));
    this.recordRateLimit(states);

    if (!res.ok) throw await buildError(res, states);

    return parse(res);
  }
}

function isJson(contentType: string): boolean {
  return contentType.toLowerCase().includes("json");
}

function parseFilename(header: string | null): string | undefined {
  if (!header) return undefined;
  return /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header)?.[1];
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
  }
}

async function buildError(res: Response, states: RateLimitState[]): Promise<ApiError> {
  let problem: Problem;
  try {
    problem = (await res.json()) as Problem;
  } catch {
    problem = { type: "Unknown", status: res.status, detail: res.statusText };
  }
  switch (res.status) {
    case 400: return new InvalidRequestError(problem);
    case 401: return new UnauthorizedError(problem);
    case 403: return new ForbiddenError(problem);
    case 404: return new NotFoundError(problem);
    case 413: return new PayloadTooLargeError(problem);
    case 422: return new UnprocessableError(problem);
    case 429: return new RateLimitedError(problem, states);
    case 500: return new InternalServerError(problem);
    case 503: return new ServiceUnavailableError(problem);
    default:  return new ApiError(res.status, problem);
  }
}
