/** Controls how the client handles 429 rate-limit responses. */
export interface RetryPolicy {
  /** Maximum number of retry attempts after a 429. Default: 3. */
  maxRetries: number;
  /** Extra milliseconds added on top of the server's reset window. Default: 1000. */
  bufferMs: number;
}

export const defaultRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  bufferMs: 1000,
};
