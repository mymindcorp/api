import { ApiClient } from "./client.js";
import { ObjectsService } from "./services/ObjectsService.js";
import { SpacesService } from "./services/SpacesService.js";
import { TagsService } from "./services/TagsService.js";
import type { SearchRequest } from "./actions/SearchRequest.js";
import type { SearchResult } from "./models/SearchResult.js";
import type { ConvertOptions } from "./actions/ConvertOptions.js";
import type { RetryPolicy } from "./ratelimiting/RetryPolicy.js";

export class MyMindClient {
  readonly objects: ObjectsService;
  readonly spaces: SpacesService;
  readonly tags: TagsService;

  private readonly http: ApiClient;

  /**
   * @param kid          Key ID from the Extensions page.
   * @param secret       Base64-encoded 128-bit secret from the Extensions page.
   * @param userAgent    Sent as `User-Agent` on every request (required by the API).
   * @param retryPolicy  Optional rate-limit retry policy overrides.
   */
  constructor(
    kid: string,
    secret: string,
    userAgent: string,
    retryPolicy?: Partial<RetryPolicy>,
  ) {
    this.http = new ApiClient(kid, secret, userAgent, retryPolicy);
    this.objects = new ObjectsService(this.http);
    this.spaces = new SpacesService(this.http);
    this.tags = new TagsService(this.http);
  }

  async search(req: SearchRequest): Promise<SearchResult> {
    return this.http.send<SearchResult>({
      method: "GET",
      path: "/search",
      query: {
        q: req.q,
        limit: req.limit,
        semantic: req.semantic,
        semanticBoost: req.semanticBoost,
        rerank: req.rerank,
      },
    });
  }

  async convert(body: string, options: ConvertOptions): Promise<string> {
    return this.http.send<string>({
      method: "POST",
      path: "/convert",
      rawBody: new TextEncoder().encode(body),
      headers: {
        "Content-Type": options.from,
        Accept: options.to,
      },
    });
  }
}

export * from "./exceptions/index.js";
export * from "./models/index.js";
export * from "./actions/index.js";
export * from "./ratelimiting/index.js";
