import type { ConvertRequest } from "./actions/ConvertRequest.js";
import type { SearchRequest } from "./actions/SearchRequest.js";
import { ApiClient, type FetchFn, type RequestOptions } from "./client.js";
import type { Prose } from "./models/Prose.js";
import type { SearchResult } from "./models/SearchResult.js";
import type { RetryPolicy } from "./ratelimiting/RetryPolicy.js";
import { ObjectsService } from "./services/ObjectsService.js";
import { SpacesService } from "./services/SpacesService.js";
import { TagsService } from "./services/TagsService.js";

/** Constructor options for {@link MyMindClient}. */
export interface MyMindClientOptions {
  /** Key ID from the Extensions page. */
  kid: string;
  /** Base64-encoded 128-bit secret from the Extensions page. */
  secret: string;
  /** Sent as `User-Agent` on every request (required by the API). */
  userAgent: string;
  /** Override the API base URL — useful for testing or staging. */
  baseUrl?: string;
  /** Override the underlying `fetch` — useful for testing or DI. */
  fetch?: FetchFn;
  /** Rate-limit and 5xx retry policy overrides. */
  retryPolicy?: Partial<RetryPolicy>;
}

/**
 * Top-level entry point for the mymind API. Exposes resource services
 * (`objects`, `spaces`, `tags`) plus the cross-cutting `search` and
 * `convert` endpoints.
 *
 * See https://access.mymind.com/api.
 */
export class MyMindClient {
  readonly objects: ObjectsService;
  readonly spaces: SpacesService;
  readonly tags: TagsService;

  private readonly http: ApiClient;

  constructor(options: MyMindClientOptions) {
    this.http = new ApiClient(options);
    this.objects = new ObjectsService(this.http);
    this.spaces = new SpacesService(this.http);
    this.tags = new TagsService(this.http);
  }

  /** `GET /search` — search objects by query, with optional semantic ranking. */
  async search(req: SearchRequest, options?: RequestOptions): Promise<SearchResult> {
    return this.http.send<SearchResult>({
      method: "GET",
      path: "/search",
      query: {
        q: req.q,
        limit: req.limit,
        semantic: req.semantic,
        semanticBoost: req.semanticBoost,
        similarTo: req.similarTo,
        rerank: req.rerank,
      },
      signal: options?.signal,
    });
  }

  /**
   * `POST /convert` — convert between plain text, Markdown, and Prose.
   *
   * The shape of `source.body` is tied to `source.type` by the discriminated
   * `ConvertSource` type — strings for `text/*`, a Prose document for
   * `application/prose+json` — so the serializer cannot send a mismatch.
   * The return type follows `targetType`: a string for text formats, a Prose
   * document for `application/prose+json`.
   *
   * `source.type` and `targetType` must differ — otherwise the API returns 422.
   */
  async convert(
    req: ConvertRequest,
    options?: RequestOptions,
  ): Promise<string | Prose> {
    const { source, targetType } = req;
    const payload =
      source.type === "application/prose+json"
        ? JSON.stringify(source.body)
        : source.body;
    return this.http.send<string | Prose>({
      method: "POST",
      path: "/convert",
      rawBody: payload,
      headers: {
        "Content-Type": source.type,
        Accept: targetType,
      },
      signal: options?.signal,
    });
  }
}

export type { FetchFn, RequestOptions } from "./client.js";
export { DEFAULT_BASE_URL, MAX_BLOB_BYTES } from "./client.js";
export * from "./actions/index.js";
export * from "./exceptions/index.js";
export * from "./models/index.js";
export * from "./ratelimiting/index.js";
