export interface Content {
  type: "text/markdown" | "text/plain" | "application/prose+json";
  body: string | object;
}
