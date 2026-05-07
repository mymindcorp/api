import type { Problem } from "../models/Problem.js";

/** Base class for all errors thrown by the API client. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: Problem,
  ) {
    super(problem.detail || problem.type);
    this.name = "ApiError";
  }
}
