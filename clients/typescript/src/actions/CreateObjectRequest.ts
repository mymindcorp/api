import type { Content } from "../models/Content.js";
import type { ObjectSpace, ObjectTag } from "../models/MindObject.js";

/**
 * Body for `POST /objects`. Provide exactly one of `blob`, `content`, or `url`.
 */
export interface CreateObjectRequest {
  /** Display title. Falls back to extraction from `url` or `content`. */
  title?: string;
  /** Spaces to add the object to on creation. */
  spaces?: ObjectSpace[];
  /** Tags to attach on creation. */
  tags?: ObjectTag[];
  /**
   * A binary payload — pass a `Blob` for raw bytes or a `File` to preserve a
   * filename through the multipart upload. Capped at 64 MB. When set, the
   * request is sent as `multipart/form-data` with the metadata JSON in the
   * `metadata` part and the bytes in `blob`.
   */
  blob?: Blob;
  /** Inline content body — a plain string or a structured Content object. */
  content?: string | Content;
  /** A remote URL to save. */
  url?: string;
}
