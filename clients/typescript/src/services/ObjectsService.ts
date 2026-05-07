import type {
  CreateObjectRequest,
  GetObjectOptions,
  ListObjectsRequest,
  PinRequest,
  RemoveObjectTagRef,
  ThumbnailOptions,
  UpdateObjectRequest,
} from "../actions/index.js";
import { MAX_BLOB_BYTES, type ApiClient, type RequestOptions } from "../client.js";
import { InvalidRequestError, PayloadTooLargeError } from "../exceptions/index.js";
import type {
  ContentType,
  MindObject,
  ObjectSpace,
  ObjectTag,
  Prose,
  WritableContent,
} from "../models/index.js";

/**
 * Resource methods for `/objects`. See https://access.mymind.com/api → Objects.
 */
export class ObjectsService {
  constructor(private readonly client: ApiClient) {}

  /** `GET /objects` — list objects, optionally filtered or searched. */
  async list(
    request?: ListObjectsRequest,
    options?: RequestOptions,
  ): Promise<MindObject[]> {
    return this.client.send<MindObject[]>({
      method: "GET",
      path: "/objects",
      query: {
        q: request?.q,
        id: request?.id,
        spaceId: request?.spaceId,
        similarTo: request?.similarTo,
        contentAs: request?.contentAs,
        limit: request?.limit,
      },
      signal: options?.signal,
    });
  }

  /**
   * `POST /objects` — create from a URL, inline content, or uploaded blob.
   * Provide exactly one of `blob`, `content`, or `url`.
   *
   * Returns `201` for new objects, or `200` with the existing object when a
   * duplicate is detected and bumped — the same `MindObject` shape either way.
   */
  async create(
    request: CreateObjectRequest,
    options?: RequestOptions,
  ): Promise<MindObject> {
    assertExactlyOneSource(request);
    if (request.blob) {
      assertWithinSizeCap(request.blob);
      const { blob, ...metadata } = request;
      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      // FormData picks up `File.name` automatically — pass `Blob`/`File` through.
      formData.append("blob", blob);
      return this.client.send<MindObject>({
        method: "POST",
        path: "/objects",
        rawBody: formData,
        signal: options?.signal,
      });
    }
    return this.client.send<MindObject>({
      method: "POST",
      path: "/objects",
      body: request,
      signal: options?.signal,
    });
  }

  /** `GET /objects/:id`. */
  async get(id: string, options?: GetObjectOptions): Promise<MindObject> {
    return this.client.send<MindObject>({
      method: "GET",
      path: `/objects/${id}`,
      query: { contentAs: options?.contentAs },
      signal: options?.signal,
    });
  }

  /** `PATCH /objects/:id` — update title and/or summary. */
  async update(
    id: string,
    request: UpdateObjectRequest,
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "PATCH",
      path: `/objects/${id}`,
      body: request,
      signal: options?.signal,
    });
  }

  /** `DELETE /objects/:id` — soft-delete; recoverable for 30 days. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.send<void>({
      method: "DELETE",
      path: `/objects/${id}`,
      signal: options?.signal,
    });
  }

  /** `POST /objects/:id/restore` — restore a soft-deleted object. */
  async restore(id: string, options?: RequestOptions): Promise<void> {
    await this.client.send<void>({
      method: "POST",
      path: `/objects/${id}/restore`,
      body: {},
      signal: options?.signal,
    });
  }

  /** `GET /objects/:id/blob` — original uploaded bytes. May 302 to a CDN URL. */
  async getBlob(id: string, options?: RequestOptions): Promise<Blob> {
    return this.client.download({
      method: "GET",
      path: `/objects/${id}/blob`,
      signal: options?.signal,
    });
  }

  /** `GET /objects/:id/screenshot` — captured at save time. May 302. */
  async getScreenshot(id: string, options?: RequestOptions): Promise<Blob> {
    return this.client.download({
      method: "GET",
      path: `/objects/${id}/screenshot`,
      signal: options?.signal,
    });
  }

  /** `GET /objects/:id/thumbnail` — preview image. May 302. */
  async getThumbnail(id: string, options?: ThumbnailOptions): Promise<Blob> {
    return this.client.download({
      method: "GET",
      path: `/objects/${id}/thumbnail`,
      query: { size: options?.size },
      signal: options?.signal,
    });
  }

  /**
   * `GET /objects/:id/content` — text-based content body.
   * The return type is narrowed by `accept`: a Prose document for
   * `application/prose+json`, otherwise a string.
   */
  getContent(id: string, accept: "application/prose+json", options?: RequestOptions): Promise<Prose>;
  getContent(id: string, accept: "text/markdown" | "text/html" | "text/plain", options?: RequestOptions): Promise<string>;
  getContent(id: string, accept?: ContentType, options?: RequestOptions): Promise<string | Prose>;
  async getContent(
    id: string,
    accept?: ContentType,
    options?: RequestOptions,
  ): Promise<string | Prose> {
    return this.client.send<string | Prose>({
      method: "GET",
      path: `/objects/${id}/content`,
      headers: accept ? { Accept: accept } : undefined,
      signal: options?.signal,
    });
  }

  /**
   * `PUT /objects/:id/content` — full-replace the content body of a Note.
   * `content.type` and `content.body` are tied by the `WritableContent`
   * discriminated union — Markdown takes a string, Prose takes a document.
   */
  async updateContent(
    id: string,
    content: WritableContent,
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "PUT",
      path: `/objects/${id}/content`,
      rawBody: encodeContent(content),
      headers: { "Content-Type": content.type },
      signal: options?.signal,
    });
  }

  /** `POST /objects/:objectId/notes` — append a note, returns its assigned id. */
  async addNote(
    objectId: string,
    content: WritableContent,
    options?: RequestOptions,
  ): Promise<string> {
    const res = await this.client.send<{ id: string }>({
      method: "POST",
      path: `/objects/${objectId}/notes`,
      rawBody: encodeContent(content),
      headers: { "Content-Type": content.type },
      signal: options?.signal,
    });
    return res.id;
  }

  /** `PUT /objects/:objectId/notes/:noteId` — full-replace a note's body. */
  async updateNote(
    objectId: string,
    noteId: string,
    content: WritableContent,
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "PUT",
      path: `/objects/${objectId}/notes/${noteId}`,
      rawBody: encodeContent(content),
      headers: { "Content-Type": content.type },
      signal: options?.signal,
    });
  }

  /** `DELETE /objects/:objectId/notes/:noteId`. */
  async deleteNote(
    objectId: string,
    noteId: string,
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "DELETE",
      path: `/objects/${objectId}/notes/${noteId}`,
      signal: options?.signal,
    });
  }

  /** `POST /objects/:objectId/tags` — add tags. Idempotent. */
  async addTags(
    id: string,
    tags: ObjectTag[],
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "POST",
      path: `/objects/${id}/tags`,
      body: { tags },
      signal: options?.signal,
    });
  }

  /** `DELETE /objects/:objectId/tags` — remove tags by `name` and/or `id`. */
  async removeTags(
    id: string,
    tags: RemoveObjectTagRef[],
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "DELETE",
      path: `/objects/${id}/tags`,
      body: tags,
      signal: options?.signal,
    });
  }

  /** `POST /objects/:objectId/spaces` — add an object to one or more spaces. */
  async addToSpaces(
    id: string,
    spaces: ObjectSpace[],
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "POST",
      path: `/objects/${id}/spaces`,
      body: spaces,
      signal: options?.signal,
    });
  }

  /** `POST /objects/:id/pin` — pin to the top of mind. */
  async pin(
    id: string,
    request?: PinRequest,
    options?: RequestOptions,
  ): Promise<void> {
    await this.client.send<void>({
      method: "POST",
      path: `/objects/${id}/pin`,
      body: request ?? {},
      signal: options?.signal,
    });
  }

  /** `DELETE /objects/:id/pin`. Idempotent. */
  async unpin(id: string, options?: RequestOptions): Promise<void> {
    await this.client.send<void>({
      method: "DELETE",
      path: `/objects/${id}/pin`,
      signal: options?.signal,
    });
  }
}

function encodeContent(content: WritableContent): string {
  return content.type === "application/prose+json"
    ? JSON.stringify(content.body)
    : content.body;
}

function assertExactlyOneSource(request: CreateObjectRequest): void {
  const provided =
    Number(request.blob !== undefined) +
    Number(request.content !== undefined) +
    Number(request.url !== undefined);
  if (provided !== 1) {
    throw new InvalidRequestError({
      type: "BadRequest",
      status: 400,
      detail: `CreateObjectRequest must provide exactly one of \`blob\`, \`content\`, or \`url\` (got ${provided}).`,
    });
  }
}

function assertWithinSizeCap(blob: Blob): void {
  if (blob.size > MAX_BLOB_BYTES) {
    throw new PayloadTooLargeError({
      type: "PayloadTooLarge",
      status: 413,
      detail: `Upload exceeds maximum size of ${MAX_BLOB_BYTES} bytes (got ${blob.size}).`,
    });
  }
}
