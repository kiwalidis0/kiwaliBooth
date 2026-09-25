import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface GifGenerationOptions {
  delay?: number; // ms per frame (default 350)
  boomerang?: boolean; // ping-pong back and forth (default false)
  maxWidth?: number; // default 500px to maintain speed and small filesize
}

/**
 * Generate an animated GIF Blob from an array of image data URLs.
 * Runs 100% in-browser with zero uploads.
 */
export async function createAnimatedGif(
  dataUrls: string[],
  options: GifGenerationOptions = {}
): Promise<{ blob: Blob; dataUrl: string }> {
  if (dataUrls.length === 0) {
    throw new Error('At least one frame is required to generate a GIF');
  }

  const delay = options.delay ?? 350;
  const isBoomerang = options.boomerang ?? false;
  const maxWidth = options.maxWidth ?? 500;

  // Load all images first
  const loadedImages = await Promise.all(
    dataUrls.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load frame image for GIF'));
          img.src = src;
        })
    )
  );

  // If boomerang, sequence: 0, 1, 2, 3, 2, 1
  let frameSequence = [...loadedImages];
  if (isBoomerang && loadedImages.length > 2) {
    const reversedMiddle = [...loadedImages.slice(1, -1)].reverse();
    frameSequence = [...loadedImages, ...reversedMiddle];
  }

  // Determine standard canvas size based on first image's aspect ratio
  const first = loadedImages[0];
  const aspect = first.naturalHeight / first.naturalWidth;
  const targetWidth = Math.min(maxWidth, first.naturalWidth || maxWidth);
  const targetHeight = Math.round(targetWidth * aspect);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const gif = GIFEncoder();

  for (const img of frameSequence) {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const palette = quantize(imgData.data, 256);
    const index = applyPalette(imgData.data, palette);

    gif.writeFrame(index, targetWidth, targetHeight, {
      palette,
      delay,
      repeat: 0, // 0 = loop forever
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes as BlobPart], { type: 'image/gif' });
  const dataUrl = URL.createObjectURL(blob);

  return { blob, dataUrl };
}
