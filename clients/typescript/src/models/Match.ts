import type { Uid } from "./Scalars.js";

export interface Match {
  id: Uid;
  score: number;
  semanticScore?: number;
}
