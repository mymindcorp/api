/** Query parameters for `GET /tags`. */
export interface ListTagsRequest {
  /** Max results. Default 1000, capped at 10,000. */
  limit?: number;
}
