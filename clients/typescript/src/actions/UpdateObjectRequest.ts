/** Body for `PATCH /objects/:id`. Omitted fields are left untouched. */
export interface UpdateObjectRequest {
  /** New display title. */
  title?: string;
  /** New summary. */
  summary?: string;
}
