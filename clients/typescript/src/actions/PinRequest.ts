/** Body for `POST /objects/:id/pin`. */
export interface PinRequest {
  /** Zero-based slot in your top of mind. Omit to append to the end. */
  position?: number;
}
