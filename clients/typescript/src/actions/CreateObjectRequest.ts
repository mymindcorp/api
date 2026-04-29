import type { Content } from "../models/Content.js";
import type { ObjectSpace, ObjectTag } from "../models/MindObject.js";
import type { Blob } from "../models/Blob.js";

export interface CreateObjectRequest {
  title?: string;
  url?: string;
  content?: Content;
  tags?: ObjectTag[];
  spaces?: ObjectSpace[];
  /**
   * Optional binary payload. When set, the object is created from the bytes
   * (multipart-style upload) and `url` / `content` are ignored.
   */
  blob?: Blob;
}
