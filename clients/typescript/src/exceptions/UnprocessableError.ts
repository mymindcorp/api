import type { Problem } from "../models/Problem.js";
import { ApiError } from "./ApiError.js";

/** 422 — the request was well-formed but failed validation. */
export class UnprocessableError extends ApiError {
  constructor(problem: Problem) {
    super(422, problem);
    this.name = "UnprocessableError";
  }
}
