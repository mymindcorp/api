import type { Uid, Timestamp, Color } from "./Scalars.js";

export interface SpaceObject {
  id: Uid;
}

export interface Space {
  id: Uid;
  name: string;
  color: Color;
  created: Timestamp;
  objects: SpaceObject[];
}
