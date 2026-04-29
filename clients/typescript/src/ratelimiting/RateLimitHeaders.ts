import type { RateLimitPolicy } from "./RateLimitPolicy.js";
import type { RateLimitState } from "./RateLimitState.js";

/**
 * Parses the `RateLimit-Policy`, `RateLimit`, and `RateLimit-Cost` response headers.
 *
 * Header format:
 * ```
 * RateLimit-Policy: "burst";q=10000;w=300, "sustained";q=100000;w=2592000
 * RateLimit:        "burst";r=9990;t=300,  "sustained";r=99641;t=2589945
 * RateLimit-Cost:   10
 * ```
 */
export function parsePolicyHeader(header: string | null | undefined): RateLimitPolicy[] {
  return splitEntries(header)
    .map((entry) => {
      const tokens = tokensOf(entry);
      const name = tokens[0]?.replace(/^"|"$/g, "");
      const q = intParam(tokens, "q");
      const w = intParam(tokens, "w");
      if (!name || q === undefined || w === undefined) return null;
      return { name, quota: q, windowSeconds: w } satisfies RateLimitPolicy;
    })
    .filter((p): p is RateLimitPolicy => p !== null);
}

export function parseStateHeader(header: string | null | undefined): RateLimitState[] {
  return splitEntries(header)
    .map((entry) => {
      const tokens = tokensOf(entry);
      const name = tokens[0]?.replace(/^"|"$/g, "");
      const r = intParam(tokens, "r");
      const t = intParam(tokens, "t");
      if (!name || r === undefined || t === undefined) return null;
      return { name, remaining: r, resetSeconds: t } satisfies RateLimitState;
    })
    .filter((s): s is RateLimitState => s !== null);
}

export function parseCostHeader(header: string | null | undefined): number {
  if (!header) return 0;
  const n = parseInt(header.trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function splitEntries(header: string | null | undefined): string[] {
  if (!header || !header.trim()) return [];
  return header.split(",").map((s) => s.trim()).filter(Boolean);
}

function tokensOf(entry: string): string[] {
  return entry.split(";").map((s) => s.trim());
}

function intParam(tokens: string[], key: string): number | undefined {
  const prefix = `${key}=`;
  const token = tokens.slice(1).find((t) => t.startsWith(prefix));
  if (!token) return undefined;
  const n = parseInt(token.slice(prefix.length), 10);
  return Number.isFinite(n) ? n : undefined;
}
