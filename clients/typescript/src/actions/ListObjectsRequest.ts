import type { ContentType } from "../models/Content.js";

/** Query parameters for `GET /objects`. */
export interface ListObjectsRequest {
  /** Search query (Lucene-inspired syntax). When set, results capped at 1000. */
  q?: string;
  /** Object IDs to fetch. Repeated as `?id=…&id=…`. */
  id?: string[];
  /** Restrict results to objects belonging to the given space. */
  spaceId?: string;
  /** (Mastermind) Return objects related to this object ID, ranked by similarity. */
  similarTo?: string;
  /** Format for `content` body — currently `text/markdown`. */
  contentAs?: ContentType;
  /** Max results. Capped at 10,000 (1,000 when `q` is set). Defaults to 10,000. */
  limit?: number;
}
