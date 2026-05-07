export interface SpaceObject {
  id: string;
}

export interface Space {
  id: string;
  /** Display name. Unique across the user's spaces. */
  name: string;
  /** Display color — any valid CSS color value, typically a hex code. */
  color: string;
  /** ISO 8601 UTC timestamp of when the space was created. */
  created: string;
  objects: SpaceObject[];
}
