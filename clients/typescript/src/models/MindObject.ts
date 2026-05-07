import type { BlobReference } from "./BlobReference.js";
import type { Content } from "./Content.js";
import type { EntityReference } from "./EntityReference.js";
import type { TagFlag } from "./TagFlag.js";

/** A tag attached to a {@link MindObject}. Identified by name. */
export interface ObjectTag {
  name: string;
  flags?: TagFlag;
}

/** A space membership reference on a {@link MindObject}. */
export interface ObjectSpace {
  id: string;
}

/** A note attached to a {@link MindObject}. */
export interface ObjectNote {
  id: string;
  content: Content;
}

/** The original source URL the object was saved from. */
export interface ObjectSource {
  url: string;
}

/**
 * An item saved to your mind — a URL, note, image, or document.
 * See https://access.mymind.com/api → Objects.
 *
 * Timestamp fields (`bumped`, `created`, `modified`, `deleted`) are
 * ISO 8601 strings in UTC.
 */
export interface MindObject {
  id: string;
  title: string;
  /** AI-generated summary. May be absent immediately after creation. */
  summary?: string;
  /** Inline content body, when the object carries one. */
  content?: Content;
  /** Underlying media for uploaded files (images, video, PDFs, …). */
  blob?: BlobReference;
  /** Screenshot captured at save time, typically for saved web pages. */
  screenshot?: BlobReference;
  /** Primary entity describing what this object is. */
  entity?: EntityReference;
  /** Spaces this object belongs to. */
  spaces?: ObjectSpace[];
  /** Tags associated with this object. */
  tags: ObjectTag[];
  /** Notes attached to this object. */
  notes?: ObjectNote[];
  /** The original source of the content. */
  source?: ObjectSource;
  /** Last bumped — defaults to `created`, refreshed on duplicate save. */
  bumped: string;
  created: string;
  modified: string;
  /** Present only when the object has been soft-deleted. */
  deleted?: string;
}
