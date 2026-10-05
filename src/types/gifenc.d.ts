declare module 'gifenc' {
  export function GIFEncoder(options?: any): any;
  export function quantize(rgba: Uint8ClampedArray | Uint8Array, maxColors: number, options?: any): number[][];
  export function applyPalette(rgba: Uint8ClampedArray | Uint8Array, palette: number[][], format?: string): Uint8Array;
}
