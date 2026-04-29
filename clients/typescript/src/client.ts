import { signRequest } from "./authentication/JwtSigner.js";
import {
  ApiError,
  ForbiddenError,
  InvalidRequestError,
  RateLimitedError,
  UnauthorizedError,
} from "./exceptions/index.js";
import type { Blob } from "./models/Blob.js";
import type { Problem } from "./models/Problem.js";
import type { RateLimitState } from "./ratelimiting/RateLimitState.js";
import { defaultRetryPolicy, type RetryPolicy } from "./ratelimiting/RetryPolicy.js";
import { parseStateHeader } from "./ratelimiting/RateLimitHeaders.js";
import { sleep } from "./util.js";

export interface DispatchOptions {
  method: string;
  path: string;
  query?: Record<string, string | string[] | number | boolean | undefined>;
  body?: unknown;
  rawBody?: BodyInit;
  headers?: Record<string, string>;
}

const BASE_URL = "https://api.mymind.com";

export class ApiClient {
  private readonly retryPolicy: RetryPolicy;
  private nextAllowedAt = 0;

  constructor(
    private readonly kid: string,
    private readonly secret: string,
    private readonly userAgent: string,
    retryPolicy?: Partial<RetryPolicy>,
  ) {
    this.retryPolicy = { ...defaultRetryPolicy, ...retryPolicy };
  }

  /** Sends a request and parses the response as `T`. */
  async send<T>(opts: DispatchOptions): Promise<T> {
    return this.run(opts, async (res) => {
      if (res.status === 204) return undefined as T;
      const ct = res.headers.get("Content-Type") ?? "";
      if (ct.includes("json")) return (await res.json()) as T;
      return (await res.arrayBuffer()) as unknown as T;
    });
  }

  /** Sends a request and returns the response as a {@link Blob}. */
  async download(opts: DispatchOptions): Promise<Blob> {
    return this.run(opts, async (res) => {
      const data = new Uint8Array(await res.arrayBuffer());
      const type = res.headers.get("Content-Type") ?? "application/octet-stream";
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
      return { data, type, name: match?.[1] };
    });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async run<T>(opts: DispatchOptions, parse: (res: Response) => Promise<T>): Promise<T> {
    const { maxRetries, bufferMs } = this.retryPolicy;
    let attempt = 0;
    while (true) {
      await this.waitForQuota();
      try {
        return await this.dispatch(opts, parse);
      } catch (err) {
        if (err instanceof RateLimitedError && attempt < maxRetries) {
          attempt++;
          const exhausted = err.states.find((s) => s.remaining === 0);
          await sleep((exhausted?.resetSeconds ?? 1) * 1000 + bufferMs);
          continue;
        }
        throw err;
      }
    }
  }

  private async waitForQuota(): Promise<void> {
    const delay = this.nextAllowedAt - Date.now();
    if (delay > 0) await sleep(delay);
  }

  private recordRateLimit(states: RateLimitState[]): void {
    const exhausted = states.find((s) => s.remaining === 0);
    if (!exhausted) return;
    const resumeAt = Date.now() + exhausted.resetSeconds * 1000 + this.retryPolicy.bufferMs;
    if (resumeAt > this.nextAllowedAt) this.nextAllowedAt = resumeAt;
  }

  private async dispatch<T>(opts: DispatchOptions, parse: (res: Response) => Promise<T>): Promise<T> {
    const url = new URL(opts.path, BASE_URL);

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
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }

    const res = await fetch(url.toString(), {
      method: opts.method,
      headers,
      body,
      redirect: "follow",
    });

    const states = parseStateHeader(res.headers.get("RateLimit"));
    this.recordRateLimit(states);

    if (!res.ok) throw await buildError(res, states);

    return parse(res);
  }
}

async function buildError(res: Response, states: RateLimitState[]): Promise<ApiError> {
  let problem: Problem;
  try {
    problem = (await res.json()) as Problem;
  } catch {
    problem = {
      type: "https://api.mymind.com/errors/unknown",
      title: res.statusText,
      status: res.status,
      detail: res.statusText,
    };
  }
  switch (res.status) {
    case 400: return new InvalidRequestError(problem);
    case 401: return new UnauthorizedError(problem);
    case 403: return new ForbiddenError(problem);
    case 429: return new RateLimitedError(problem, states);
    default:  return new ApiError(res.status, problem);
  }
}
