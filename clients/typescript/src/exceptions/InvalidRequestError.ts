import type { Problem } from "../models/Problem.js";
import { ApiError } from "./ApiError.js";

export class InvalidRequestError extends ApiError {
  constructor(problem: Problem) {
    super(400, problem);
    this.name = "InvalidRequestError";
  }
}
