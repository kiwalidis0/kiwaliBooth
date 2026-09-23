import type { LayoutConfig, TemplateConfig } from '../types/photobooth';

/**
 * Creates a clean SVG overlay data URL for built-in template decorations.
 * Kept strictly minimal: crisp layout branding with no barcodes, archive marks, or header clutter.
 */
export function generateTemplateOverlaySvg(layout: LayoutConfig, template: TemplateConfig): string {
  const { width, height } = layout;

  let brandColor = '#1C1917';
  if (template.theme === 'noir') {
    brandColor = '#F8FAFC';
  } else if (template.theme === 'pastel') {
    brandColor = '#7E22CE';
  }

  // Pure clean photostrip brand mark: just "kiwalibooth" at the bottom footer area
  const footerY = height - 52;

  const decorations = `
    <g id="decorations">
      <!-- Clean, minimal kiwalibooth footer text only -->
      <text
        x="${width / 2}"
        y="${footerY}"
        text-anchor="middle"
        font-family="'Fredoka', sans-serif"
        font-weight="600"
        font-size="22"
        fill="${brandColor}"
        letter-spacing="0.5"
      >kiwalibooth</text>
    </g>
  `;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${decorations}
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
