declare module 'gifenc' {
  export interface GIFEncoderOptions {
    auto?: boolean;
    initialCapacity?: number;
  }

  export interface WriteFrameOptions {
    palette?: number[][];
    delay?: number;
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOptions
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
    reset: () => void;
  }

  export function GIFEncoder(opts?: GIFEncoderOptions): GIFEncoderInstance;

  export function quantize(
    rgba: Uint8ClampedArray | Uint8Array,
    maxColors?: number,
    opts?: {
      format?: string;
      oneBitAlpha?: boolean;
      clearAlpha?: boolean;
      clearAlphaThreshold?: number;
      clearAlphaColor?: number;
    }
  ): number[][];

  export function applyPalette(
    rgba: Uint8ClampedArray | Uint8Array,
    palette: number[][],
    format?: string
  ): Uint8Array;
}
