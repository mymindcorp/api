export interface Match {
  /** The unique identifier of the matching object. */
  id: string;
  /** Relevance score. Higher is a stronger match. */
  score: number;
  /** Semantic similarity score. Present when `semantic=true` (or `rerank=true`). */
  semanticScore?: number;
}
