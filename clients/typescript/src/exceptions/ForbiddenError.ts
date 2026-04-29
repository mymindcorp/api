import type { Problem } from "../models/Problem.js";
import { ApiError } from "./ApiError.js";

export class ForbiddenError extends ApiError {
  constructor(problem: Problem) {
    super(403, problem);
    this.name = "ForbiddenError";
  }
}
