/** Quota and window declared by the `RateLimit-Policy` response header. */
export interface RateLimitPolicy {
  /** Policy identifier (e.g. `"burst"` or `"sustained"`). */
  name: string;
  /** Total credits granted for the window. */
  quota: number;
  /** Window length, in seconds. */
  windowSeconds: number;
}
