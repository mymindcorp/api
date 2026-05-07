/**
 * RFC 9457 problem detail returned by the API for error responses
 * (`Content-Type: application/problem+json`).
 *
 * Branch on `type` — `detail` is human-readable and may change.
 */
export interface Problem {
  type: string;
  status: number;
  detail: string;
}
