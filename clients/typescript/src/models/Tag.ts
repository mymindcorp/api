import type { Uid, Timestamp } from "./Scalars.js";
import type { TagFlag } from "./TagFlag.js";

export interface Tag {
  id: Uid;
  name: string;
  count: number;
  flags: TagFlag;
  modified: Timestamp;
}
