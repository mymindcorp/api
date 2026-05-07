import type { Prose } from "./Prose.js";

/**
 * A tagged union representing a content body. The `type` discriminator
 * pins down `body` exactly: a string for `text/*`, a Prose document for
 * `application/prose+json`.
 */
export type Content =
  | { type: "text/plain"; body: string }
  | { type: "text/markdown"; body: string }
  | { type: "text/html"; body: string }
  | { type: "application/prose+json"; body: Prose };

export type ContentType = Content["type"];

/**
 * The subset of {@link Content} accepted by content-bearing write endpoints
 * (`POST /objects/:id/notes`, `PUT /objects/:id/content`, …). The server
 * accepts only Markdown or Prose for these.
 */
export type WritableContent = Extract<
  Content,
  { type: "text/markdown" | "application/prose+json" }
>;

/** Subset of {@link ContentType} accepted by write endpoints. */
export type WritableContentType = WritableContent["type"];
