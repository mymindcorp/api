import type { RequestOptions } from "../client.js";

/** Options for `GET /objects/:id/thumbnail`. */
export interface ThumbnailOptions extends RequestOptions {
  /**
   * Containment box as `WxH` (e.g. `100x100`). The thumbnail is scaled to
   * fit inside this box, preserving aspect ratio. Omit for the default.
   */
  size?: string;
}
