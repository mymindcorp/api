import type { Problem } from "../models/Problem.js";
import { ApiError } from "./ApiError.js";

/** 404 — the requested resource doesn't exist or is outside the key's scope. */
export class NotFoundError extends ApiError {
  constructor(problem: Problem) {
    super(404, problem);
    this.name = "NotFoundError";
  }
}
