import type { Content } from "./Content.js";
import type { Uid, Timestamp } from "./Scalars.js";
import type { TagFlag } from "./TagFlag.js";

export interface ObjectTag {
  name: string;
  flags?: TagFlag;
}

export interface ObjectSpace {
  id: Uid;
}

export interface ObjectNote {
  id: Uid;
  body: string;
}

export interface ObjectSource {
  URL: string;
}

export interface MindObject {
  id: Uid;
  title: string;
  content?: Content;
  spaces?: ObjectSpace[];
  tags: ObjectTag[];
  notes?: ObjectNote[];
  source?: ObjectSource;
  bumped: Timestamp;
  created: Timestamp;
  modified: Timestamp;
  deleted?: Timestamp;
}
