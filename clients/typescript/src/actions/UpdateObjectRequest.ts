import type { ObjectSpace, ObjectTag } from "../models/MindObject.js";

export interface UpdateObjectRequest {
  title?: string;
  tags?: ObjectTag[];
  spaces?: ObjectSpace[];
}
