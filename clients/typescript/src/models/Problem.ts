/** RFC 7807 problem detail returned by the API for error responses. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
}
