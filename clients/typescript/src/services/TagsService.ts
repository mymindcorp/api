import type { ApiClient } from "../client.js";
import type { Tag } from "../models/index.js";
import type { ListTagsRequest } from "../actions/index.js";

export class TagsService {
  constructor(private readonly client: ApiClient) {}

  async list(request?: ListTagsRequest): Promise<Tag[]> {
    return this.client.send<Tag[]>({
      method: "GET",
      path: "/tags",
      query: { limit: request?.limit },
    });
  }
}
