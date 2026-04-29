import type { Color } from "../models/Scalars.js";

export interface CreateSpaceRequest {
  name: string;
  color?: Color;
}
