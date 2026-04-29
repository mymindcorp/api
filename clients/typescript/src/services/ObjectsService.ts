import type { ApiClient } from "../client.js";
import type { Blob, Match, MindObject, ObjectSpace, ObjectTag, Uid } from "../models/index.js";
import type {
  CreateObjectRequest,
  ListObjectsRequest,
  PinRequest,
  GetRelatedObjectsRequest,
  UpdateObjectRequest,
} from "../actions/index.js";

export class ObjectsService {
  constructor(private readonly client: ApiClient) {}

  async list(request?: ListObjectsRequest): Promise<MindObject[]> {
    const res = await this.client.send<{ objects: MindObject[] }>({
      method: "GET",
      path: "/objects",
      query: {
        q: request?.q,
        id: request?.id,
        contentAs: request?.contentAs,
        limit: request?.limit,
      },
    });
    return res.objects ?? [];
  }

  async create(request: CreateObjectRequest): Promise<MindObject> {
    if (request.blob) {
      const { blob, ...metadata } = request;
      const formData = new FormData();
      formData.append(
        "metadata",
        new globalThis.Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      formData.append(
        "blob",
        new globalThis.Blob([blob.data], { type: blob.type }),
        blob.name,
      );
      return this.client.send<MindObject>({
        method: "POST",
        path: "/objects",
        rawBody: formData,
      });
    }
    return this.client.send<MindObject>({
      method: "POST",
      path: "/objects",
      body: request,
    });
  }

  async get(id: Uid, contentAs?: string): Promise<MindObject> {
    return this.client.send<MindObject>({
      method: "GET",
      path: `/objects/${id}`,
      query: { contentAs },
    });
  }

  async update(id: Uid, request: UpdateObjectRequest): Promise<MindObject> {
    return this.client.send<MindObject>({
      method: "PATCH",
      path: `/objects/${id}`,
      body: request,
    });
  }

  async delete(id: Uid): Promise<void> {
    return this.client.send<void>({ method: "DELETE", path: `/objects/${id}` });
  }

  async restore(id: Uid): Promise<void> {
    return this.client.send<void>({
      method: "POST",
      path: `/objects/${id}/restore`,
      body: {},
    });
  }

  async related(id: Uid, request?: GetRelatedObjectsRequest): Promise<Match[]> {
    const res = await this.client.send<{ matches: Match[] }>({
      method: "GET",
      path: `/objects/${id}/related`,
      query: { limit: request?.limit },
    });
    return res.matches ?? [];
  }

  async download(id: Uid): Promise<Blob> {
    return this.client.download({
      method: "GET",
      path: `/objects/${id}/download`,
    });
  }

  async getContent(id: Uid, accept: string): Promise<string> {
    return this.client.send<string>({
      method: "GET",
      path: `/objects/${id}/content`,
      headers: { Accept: accept },
    });
  }

  async updateContent(id: Uid, body: string, contentType: string): Promise<void> {
    return this.client.send<void>({
      method: "PUT",
      path: `/objects/${id}/content`,
      rawBody: new TextEncoder().encode(body),
      headers: { "Content-Type": contentType },
    });
  }

  async pin(id: Uid, request?: PinRequest): Promise<void> {
    return this.client.send<void>({
      method: "POST",
      path: `/objects/${id}/pin`,
      body: request ?? {},
    });
  }

  async unpin(id: Uid): Promise<void> {
    return this.client.send<void>({
      method: "DELETE",
      path: `/objects/${id}/pin`,
    });
  }

  async tag(id: Uid, tags: ObjectTag[]): Promise<void> {
    return this.client.send<void>({
      method: "POST",
      path: `/objects/${id}/tags`,
      body: { tags },
    });
  }

  async addToSpaces(id: Uid, spaces: ObjectSpace[]): Promise<void> {
    return this.client.send<void>({
      method: "POST",
      path: `/objects/${id}/spaces`,
      body: spaces,
    });
  }
}
