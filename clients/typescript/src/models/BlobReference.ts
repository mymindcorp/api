import type { Palette } from "./Palette.js";

/**
 * Reference to a binary object on `https://mymind.media`, returned in the
 * `blob` and `screenshot` fields of a {@link MindObject}.
 */
export interface BlobReference {
  /** Path under `https://mymind.media`. */
  path: string;
  /** MIME type of the blob, e.g. `image/jpeg`. */
  type: string;
  /** Fully-qualified URL to the blob, when present. */
  url?: string;
  /** Width in pixels, for visual blobs. */
  width?: number;
  /** Height in pixels, for visual blobs. */
  height?: number;
  /** Dominant colors of the blob, weighted. Present for image blobs. */
  palette?: Palette;
}
