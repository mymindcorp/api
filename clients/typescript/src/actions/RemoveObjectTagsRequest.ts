/**
 * A single tag reference in `DELETE /objects/:id/tags`. Each entry must
 * carry either `name` or `id` — clients may mix and match within a request.
 */
export interface RemoveObjectTagRef {
  name?: string;
  id?: string;
}
