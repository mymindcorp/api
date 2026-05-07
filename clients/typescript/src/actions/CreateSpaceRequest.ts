/** Body for `POST /spaces`. */
export interface CreateSpaceRequest {
  /** Display name. Must be unique across your spaces. */
  name: string;
  /** Display color (CSS color value). If omitted, one is assigned automatically. */
  color?: string;
}
