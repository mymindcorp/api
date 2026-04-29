/** Per-policy quota state from the `RateLimit` response header. */
export interface RateLimitState {
  /** Policy identifier matching an entry in `RateLimit-Policy`. */
  name: string;
  /** Credits remaining in the current window. `0` means exhausted. */
  remaining: number;
  /** Seconds until the window resets. */
  resetSeconds: number;
}
