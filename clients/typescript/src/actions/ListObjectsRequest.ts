import type { Uid } from "../models/Scalars.js";

export interface ListObjectsRequest {
  q?: string;
  id?: Uid[];
  contentAs?: string;
  limit?: number;
}
