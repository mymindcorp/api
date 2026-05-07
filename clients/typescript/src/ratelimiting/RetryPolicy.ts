/** Controls how the client retries 429 and 5xx responses. */
export interface RetryPolicy {
  /** Maximum retry attempts. Default: 3. */
  maxRetries: number;
  /** Extra ms added on top of the server's reset window after a 429. Default: 1000. */
  bufferMs: number;
  /** Initial back-off after a 5xx, doubled per retry. Default: 500. */
  initialBackoffMs: number;
  /** Cap on the 5xx exponential back-off. Default: 30,000. */
  maxBackoffMs: number;
}

export const defaultRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  bufferMs: 1000,
  initialBackoffMs: 500,
  maxBackoffMs: 30_000,
};
