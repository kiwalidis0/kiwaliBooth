import type { LayoutConfig, TemplateConfig } from '../types/photobooth';

/**
 * Creates a clean SVG overlay data URL for built-in template decorations.
 * Kept strictly minimal: subtle kiwalibooth mark at the very bottom, leaving prominent space for the memory text & date.
 */
export function generateTemplateOverlaySvg(layout: LayoutConfig, template: TemplateConfig): string {
  const { width, height } = layout;

  let brandColor = '#1C1917';
  if (template.theme === 'noir') {
    brandColor = '#94A3B8';
  } else if (template.theme === 'pastel') {
    brandColor = '#A855F7';
  }

  // Subtle clean photostrip brand mark at the very bottom
  const footerY = height - 20;

  const decorations = `
    <g id="decorations">
      <text
        x="${width / 2}"
        y="${footerY}"
        text-anchor="middle"
        font-family="'Fredoka', sans-serif"
        font-weight="600"
        font-size="13"
        fill="${brandColor}"
        opacity="0.85"
        letter-spacing="1.5"
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
