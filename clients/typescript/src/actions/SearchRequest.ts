export interface SearchRequest {
  q: string;
  limit?: number;
  semantic?: boolean;
  semanticBoost?: number;
  rerank?: boolean;
}
