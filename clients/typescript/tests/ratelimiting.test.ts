import { describe, expect, it } from "vitest";
import {
  parseCostHeader,
  parsePolicyHeader,
  parseStateHeader,
} from "../src/ratelimiting/index.js";

describe("parsePolicyHeader", () => {
  it("parses a single quoted policy", () => {
    expect(parsePolicyHeader('"burst";q=10000;w=300')).toEqual([
      { name: "burst", quota: 10000, windowSeconds: 300 },
    ]);
  });

  it("parses multiple comma-separated policies", () => {
    expect(
      parsePolicyHeader(
        '"burst";q=10000;w=300, "sustained";q=100000;w=2592000',
      ),
    ).toEqual([
      { name: "burst", quota: 10000, windowSeconds: 300 },
      { name: "sustained", quota: 100000, windowSeconds: 2592000 },
    ]);
  });

  it("tolerates extra whitespace around tokens", () => {
    expect(parsePolicyHeader('  "burst" ; q=10 ; w=5  ')).toEqual([
      { name: "burst", quota: 10, windowSeconds: 5 },
    ]);
  });

  it("strips surrounding double quotes from the policy name", () => {
    expect(parsePolicyHeader('"burst";q=1;w=2')[0].name).toBe("burst");
    expect(parsePolicyHeader('burst;q=1;w=2')[0].name).toBe("burst");
  });

  it("returns [] for null, undefined, or empty input", () => {
    expect(parsePolicyHeader(null)).toEqual([]);
    expect(parsePolicyHeader(undefined)).toEqual([]);
    expect(parsePolicyHeader("")).toEqual([]);
    expect(parsePolicyHeader("   ")).toEqual([]);
  });

  it("filters out entries missing q or w", () => {
    expect(parsePolicyHeader('"burst";q=10')).toEqual([]);
    expect(parsePolicyHeader('"burst";w=10')).toEqual([]);
    expect(
      parsePolicyHeader('"burst";q=10;w=5, "broken";q=10'),
    ).toEqual([{ name: "burst", quota: 10, windowSeconds: 5 }]);
  });
});

describe("parseStateHeader", () => {
  it("parses a single state entry", () => {
    expect(parseStateHeader('"burst";r=9990;t=300')).toEqual([
      { name: "burst", remaining: 9990, resetSeconds: 300 },
    ]);
  });

  it("parses multiple states", () => {
    expect(
      parseStateHeader('"burst";r=9990;t=300, "sustained";r=99641;t=2589945'),
    ).toEqual([
      { name: "burst", remaining: 9990, resetSeconds: 300 },
      { name: "sustained", remaining: 99641, resetSeconds: 2589945 },
    ]);
  });

  it("handles an exhausted policy (r=0, t=0)", () => {
    expect(parseStateHeader('"burst";r=0;t=0')).toEqual([
      { name: "burst", remaining: 0, resetSeconds: 0 },
    ]);
  });

  it("returns [] for null, undefined, or empty input", () => {
    expect(parseStateHeader(null)).toEqual([]);
    expect(parseStateHeader(undefined)).toEqual([]);
    expect(parseStateHeader("")).toEqual([]);
  });

  it("filters out entries missing r or t", () => {
    expect(parseStateHeader('"burst";r=10')).toEqual([]);
    expect(parseStateHeader('"burst";t=10')).toEqual([]);
  });
});

describe("parseCostHeader", () => {
  it("parses a numeric cost", () => {
    expect(parseCostHeader("10")).toBe(10);
  });

  it("trims surrounding whitespace", () => {
    expect(parseCostHeader("  42  ")).toBe(42);
  });

  it("returns 0 for null, undefined, or empty input", () => {
    expect(parseCostHeader(null)).toBe(0);
    expect(parseCostHeader(undefined)).toBe(0);
    expect(parseCostHeader("")).toBe(0);
  });

  it("returns 0 for non-numeric input", () => {
    expect(parseCostHeader("abc")).toBe(0);
  });
});
