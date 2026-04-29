import type { Problem } from "../models/Problem.js";
import { ApiError } from "./ApiError.js";

export class UnauthorizedError extends ApiError {
  constructor(problem: Problem) {
    super(401, problem);
    this.name = "UnauthorizedError";
  }
}
