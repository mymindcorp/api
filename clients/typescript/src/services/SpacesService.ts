import type { ApiClient } from "../client.js";
import type { Space, Uid } from "../models/index.js";
import type { CreateSpaceRequest, UpdateSpaceRequest } from "../actions/index.js";

export class SpacesService {
  constructor(private readonly client: ApiClient) {}

  async list(): Promise<Space[]> {
    return this.client.send<Space[]>({ method: "GET", path: "/spaces" });
  }

  async create(request: CreateSpaceRequest): Promise<Space> {
    return this.client.send<Space>({
      method: "POST",
      path: "/spaces",
      body: request,
    });
  }

  async get(id: Uid): Promise<Space> {
    return this.client.send<Space>({ method: "GET", path: `/spaces/${id}` });
  }

  async update(id: Uid, request: UpdateSpaceRequest): Promise<Space> {
    return this.client.send<Space>({
      method: "PATCH",
      path: `/spaces/${id}`,
      body: request,
    });
  }

  async delete(id: Uid): Promise<void> {
    return this.client.send<void>({ method: "DELETE", path: `/spaces/${id}` });
  }

  async addObject(spaceId: Uid, objectId: Uid): Promise<void> {
    return this.client.send<void>({
      method: "PUT",
      path: `/spaces/${spaceId}/objects/${objectId}`,
    });
  }

  async removeObject(spaceId: Uid, objectId: Uid): Promise<void> {
    return this.client.send<void>({
      method: "DELETE",
      path: `/spaces/${spaceId}/objects/${objectId}`,
    });
  }
}
