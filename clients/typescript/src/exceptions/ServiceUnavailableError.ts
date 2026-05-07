import type { Problem } from "../models/Problem.js";
import { ApiError } from "./ApiError.js";

/** 503 — the service is temporarily unavailable. Retry later. */
export class ServiceUnavailableError extends ApiError {
  constructor(problem: Problem) {
    super(503, problem);
    this.name = "ServiceUnavailableError";
  }
}
