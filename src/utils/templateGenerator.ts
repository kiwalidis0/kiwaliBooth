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
  } else if (template.theme === 'filmstrip') {
    brandColor = '#F59E0B';
  } else if (template.theme === 'polaroid') {
    brandColor = '#78716C';
  } else if (template.theme === 'doodles') {
    brandColor = '#F472B6';
  } else if (template.theme === 'retro90') {
    brandColor = '#C45E3D';
  } else if (template.theme === 'custom') {
    brandColor = template.accentColor || template.textColor || '#1C1917';
  }

  // Generate theme-specific physical and decorative accents
  let themeExtras = '';

  if (template.theme === 'filmstrip') {
    // 35mm film strip sprocket holes along left and right borders
    const sprocketWidth = 14;
    const sprocketHeight = 22;
    const sprocketStep = 42;
    const leftMargin = 12;
    const rightMargin = width - leftMargin - sprocketWidth;

    const count = Math.floor((height - 30) / sprocketStep);
    let sprocketsSvg = '';

    for (let i = 0; i < count; i++) {
      const sy = 24 + i * sprocketStep;
      // Left sprocket
      sprocketsSvg += `<rect x="${leftMargin}" y="${sy}" width="${sprocketWidth}" height="${sprocketHeight}" rx="4" fill="#2A2A32" />`;
      // Right sprocket
      sprocketsSvg += `<rect x="${rightMargin}" y="${sy}" width="${sprocketWidth}" height="${sprocketHeight}" rx="4" fill="#2A2A32" />`;
    }

    // Frame markers & analog codes along margins
    themeExtras = `
      <g id="sprockets">
        ${sprocketsSvg}
        <text x="32" y="16" font-family="monospace" font-size="10" fill="#F59E0B" font-weight="bold" opacity="0.8">▶ 24A</text>
        <text x="${width - 90}" y="16" font-family="monospace" font-size="10" fill="#F59E0B" font-weight="bold" opacity="0.8">K-400 • ISO400</text>
        <text x="32" y="${height - 8}" font-family="monospace" font-size="10" fill="#F59E0B" font-weight="bold" opacity="0.8">SAFETY FILM</text>
        <text x="${width - 70}" y="${height - 8}" font-family="monospace" font-size="10" fill="#F59E0B" font-weight="bold" opacity="0.8">25 ▶▶</text>
      </g>
    `;
  } else if (template.theme === 'doodles') {
    // Cute pastel corner stars & playful accents
    themeExtras = `
      <g id="doodles" fill="#F472B6" opacity="0.75">
        <path d="M 28 20 Q 32 28 40 28 Q 32 28 28 36 Q 24 28 16 28 Q 24 28 28 20 Z" />
        <path d="M ${width - 32} 24 Q ${width - 28} 32 ${width - 20} 32 Q ${width - 28} 32 ${width - 32} 40 Q ${width - 36} 32 ${width - 44} 32 Q ${width - 36} 32 ${width - 32} 24 Z" />
        <circle cx="48" cy="22" r="3" />
        <circle cx="${width - 50}" cy="38" r="3" />
      </g>
    `;
  }

  // Photostrip brand mark at the bottom
  const footerY = height - 16;

  const decorations = `
    <g id="decorations">
      ${themeExtras}
      <text
        x="${width / 2}"
        y="${footerY}"
        text-anchor="middle"
        font-family="'Fredoka', sans-serif"
        font-weight="600"
        font-size="20"
        fill="${brandColor}"
        opacity="0.88"
        letter-spacing="2"
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
