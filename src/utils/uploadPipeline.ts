/**
 * Client-side image upload pipeline.
 *
 * Responsibilities:
 * - Downscale images larger than MAX_PX on their longest edge (prevents OOM on 4x phone photos)
 * - Re-encode to JPEG at quality 0.85
 * - Revoke any intermediate object URLs to free memory
 * - Return validation warnings for the caller to surface to the user
 *
 * Privacy: 100% in-browser, zero network requests.
 */

const MAX_PX = 2000;
const OUTPUT_QUALITY = 0.85;

export interface UploadResult {
  dataUrl: string;
  width: number;
  height: number;
  /** Non-fatal warnings to show the user */
  warnings: string[];
}

/**
 * Process a single File through the downscale + encode pipeline.
 * Returns a dataUrl (JPEG) and any warnings.
 */
export async function processUploadedFile(file: File): Promise<UploadResult> {
  const warnings: string[] = [];

  // HEIC notice — browsers cannot decode HEIC natively (except Safari 17+)
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  ) {
    warnings.push('HEIC format may not display correctly in all browsers. Convert to JPEG for best results.');
  }

  // Large file size hint (not blocking)
  if (file.size > 15_000_000) {
    warnings.push('Large file — processing may take a moment.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const { dataUrl, width, height } = await loadAndResize(objectUrl);

    if (width < 800 || height < 800) {
      warnings.push(`Photo is ${width}×${height}px — may appear soft in prints. For best quality use a photo at least 800×800px.`);
    }

    return { dataUrl, width, height, warnings };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadAndResize(src: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas 2D context unavailable')); return; }

      ctx.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', OUTPUT_QUALITY), width: w, height: h });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
