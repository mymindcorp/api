import type { Problem } from "../models/Problem.js";
import { ApiError } from "./ApiError.js";

/** 413 — the request body exceeds the maximum allowed size (64 MB for attachments). */
export class PayloadTooLargeError extends ApiError {
  constructor(problem: Problem) {
    super(413, problem);
    this.name = "PayloadTooLargeError";
  }
}
