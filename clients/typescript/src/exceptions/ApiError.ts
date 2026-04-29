import type { Problem } from "../models/Problem.js";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: Problem,
  ) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
  }
}
