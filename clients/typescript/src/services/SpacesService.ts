import type { CreateSpaceRequest, UpdateSpaceRequest } from "../actions/index.js";
import type { ApiClient, RequestOptions } from "../client.js";
import type { Space } from "../models/index.js";

/**
 * Resource methods for `/spaces`. See https://access.mymind.com/api → Spaces.
 */
export class SpacesService {
  constructor(private readonly client: ApiClient) {}

  /** `GET /spaces`. */
  async list(options?: RequestOptions): Promise<Space[]> {
    return this.client.send<Space[]>({
      method: "GET",
      path: "/spaces",
      signal: options?.signal,
    });
  }

  /** `POST /spaces`. */
  async create(
    request: CreateSpaceRequest,
    options?: RequestOptions,
  ): Promise<Space> {
    return this.client.send<Space>({
      method: "POST",
      path: "/spaces",
      body: request,
      signal: options?.signal,
    });
  }

  /** `GET /spaces/:id`. */
  async get(id: string, options?: RequestOptions): Promise<Space> {
    return this.client.send<Space>({
      method: "GET",
      path: `/spaces/${id}`,
      signal: options?.signal,
    });
  }

  /** `PATCH /spaces/:id`. */
  async update(
    id: string,
    request: UpdateSpaceRequest,
    options?: RequestOptions,
  ): Promise<Space> {
    return this.client.send<Space>({
      method: "PATCH",
      path: `/spaces/${id}`,
      body: request,
      signal: options?.signal,
    });
  }

  /** `DELETE /spaces/:id`. Idempotent. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.send<void>({
      method: "DELETE",
      path: `/spaces/${id}`,
      signal: options?.signal,
    });
  }

  /** `PUT /spaces/:spaceId/objects/:objectId` — add object to space. Idempotent. */
  async addObject(
    spaceId: string,
    objectId: string,
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "PUT",
      path: `/spaces/${spaceId}/objects/${objectId}`,
      signal: options?.signal,
    });
  }

  /** `DELETE /spaces/:spaceId/objects/:objectId`. Idempotent. */
  async removeObject(
    spaceId: string,
    objectId: string,
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "DELETE",
      path: `/spaces/${spaceId}/objects/${objectId}`,
      signal: options?.signal,
    });
  }
}
