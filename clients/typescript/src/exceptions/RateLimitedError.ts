import type { Problem } from "../models/Problem.js";
import type { RateLimitState } from "../ratelimiting/RateLimitState.js";
import { ApiError } from "./ApiError.js";

export class RateLimitedError extends ApiError {
  constructor(
    problem: Problem,
    public readonly states: RateLimitState[],
  ) {
    super(429, problem);
    this.name = "RateLimitedError";
  }
}
