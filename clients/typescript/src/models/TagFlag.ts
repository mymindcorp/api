export const TagFlag = {
  None: 0,
  AI: 2,
  Manual: 8,
} as const;

export type TagFlag = (typeof TagFlag)[keyof typeof TagFlag];
