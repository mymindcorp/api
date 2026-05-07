/** Query parameters for `GET /search`. */
export interface SearchRequest {
  /** Search query (Lucene-inspired syntax). Required. */
  q: string;
  /** Max results per page. Default 20, capped at 1000 (100 when `rerank=true`). */
  limit?: number;
  /** Match by meaning rather than exact terms. Default false. */
  semantic?: boolean;
  /** Multiplier on semantic relevance. Only applies when `semantic=true`. */
  semanticBoost?: number;
  /** (Mastermind) Find content similar to the given object ID. Implies `semantic=true`. */
  similarTo?: string;
  /** (Mastermind) Re-score with a cross-encoder. Implies `semantic=true`, caps results at 100. */
  rerank?: boolean;
}
