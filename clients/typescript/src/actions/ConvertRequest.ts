import type { Prose } from "../models/Prose.js";

/** Source/target media types accepted by `POST /convert`. */
export type ConvertFormat =
  | "text/plain"
  | "text/markdown"
  | "application/prose+json";

/**
 * Source body for `POST /convert`. The `type` discriminator pins down
 * `body` — a string for `text/*`, a Prose document for `application/prose+json`.
 */
export type ConvertSource =
  | { type: "text/plain"; body: string }
  | { type: "text/markdown"; body: string }
  | { type: "application/prose+json"; body: Prose };

/** Request for `POST /convert`. `source.type` and `targetType` must differ. */
export interface ConvertRequest {
  source: ConvertSource;
  targetType: ConvertFormat;
}
