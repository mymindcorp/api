import type { RequestOptions } from "../client.js";
import type { ContentType } from "../models/Content.js";

/** Options for `GET /objects/:id`. */
export interface GetObjectOptions extends RequestOptions {
  /** Format for `content` body. Currently `text/markdown`. */
  contentAs?: ContentType;
}
