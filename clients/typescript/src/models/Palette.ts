/**
 * Map of dominant colors (CSS values, typically hex codes) to their relative
 * weight in the source. Weights are between `0` and `1` and typically sum
 * to `1.0`. Used to describe the color makeup of an image or other visual.
 */
export type Palette = Record<string, number>;
