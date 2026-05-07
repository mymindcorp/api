import type { TagFlag } from "./TagFlag.js";

/**
 * A free-form label attached to one or more {@link MindObject}s.
 * Tags have no separate identifier — they are referenced by name.
 */
export interface Tag {
  name: string;
  count: number;
  flags: TagFlag;
  /** ISO 8601 UTC timestamp of the last add/remove for this tag. */
  modified: string;
}
