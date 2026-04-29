/**
 * A binary payload — used both for uploads (on `CreateObjectRequest`)
 * and for downloads (returned by `ObjectsService.download`).
 */
export interface Blob {
  data: Uint8Array;
  type: string;
  name?: string;
}
