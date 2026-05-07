/**
 * mymind's internal rich-text format, served as `application/prose+json`.
 * A tree of nodes loosely modeled on ProseMirror's document schema.
 */
export interface ProseNode {
  type: string;
  content?: ProseNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: ProseMark[];
}

export interface ProseMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/** A `doc` Prose node — the root of every document. */
export interface ProseDocument extends ProseNode {
  type: "doc";
  content: ProseNode[];
}

/** Convenience alias for the body type carried by `application/prose+json`. */
export type Prose = ProseDocument;
