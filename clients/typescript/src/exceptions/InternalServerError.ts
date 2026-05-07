import type { Problem } from "../models/Problem.js";
import { ApiError } from "./ApiError.js";

/** 500 — an unexpected server error. Safe to retry with exponential backoff. */
export class InternalServerError extends ApiError {
  constructor(problem: Problem) {
    super(500, problem);
    this.name = "InternalServerError";
  }
}
