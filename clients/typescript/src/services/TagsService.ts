import type { ListTagsRequest } from "../actions/index.js";
import type { ApiClient, RequestOptions } from "../client.js";
import type { Tag } from "../models/index.js";

/** Resource methods for `/tags`. See https://access.mymind.com/api → Tags. */
export class TagsService {
  constructor(private readonly client: ApiClient) {}

  /** `GET /tags`. */
  async list(
    request?: ListTagsRequest,
    options?: RequestOptions,
  ): Promise<Tag[]> {
    return this.client.send<Tag[]>({
      method: "GET",
      path: "/tags",
      query: { limit: request?.limit },
      signal: options?.signal,
    });
  }
}
