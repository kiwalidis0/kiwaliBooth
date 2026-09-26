export interface VectorSticker {
  id: string;
  name: string;
  category: 'Cute' | 'Love' | 'Celebration' | 'Photo';
  svg: string;
  dataUrl: string;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const STICKER_CATEGORIES = ['Cute', 'Love', 'Celebration', 'Photo'] as const;
export type StickerCategory = typeof STICKER_CATEGORIES[number];

const RAW_STICKERS: Omit<VectorSticker, 'dataUrl'>[] = [
  // --- CUTE ---
  {
    id: 'cute-ribbon',
    name: 'Coquette Bow',
    category: 'Cute',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M50 44 C42 28 15 26 22 52 C26 62 44 52 50 48 Z" fill="#FF6B81" />
      <path d="M50 44 C58 28 85 26 78 52 C74 62 56 52 50 48 Z" fill="#FF6B81" />
      <path d="M42 50 C38 68 30 84 26 88 C32 82 42 74 48 54 Z" fill="#FF526C" />
      <path d="M58 50 C62 68 70 84 74 88 C68 82 58 74 52 54 Z" fill="#FF526C" />
      <circle cx="50" cy="47" r="7" fill="#FFA3B1" stroke="#FF526C" stroke-width="2" />
    </svg>`,
  },
  {
    id: 'cute-sparkle-star',
    name: 'Retro Sparkle',
    category: 'Cute',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M50 6 Q50 50 6 50 Q50 50 50 94 Q50 50 94 50 Q50 50 50 6 Z" fill="#FFD166" stroke="#F59E0B" stroke-width="3" />
      <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
      <circle cx="24" cy="24" r="3" fill="#FFD166" />
      <circle cx="76" cy="76" r="3" fill="#FFD166" />
    </svg>`,
  },
  {
    id: 'cute-cherries',
    name: 'Sweet Cherries',
    category: 'Cute',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M35 55 C38 28 55 18 68 16" fill="none" stroke="#22C55E" stroke-width="4" stroke-linecap="round" />
      <path d="M65 60 C62 35 58 20 68 16" fill="none" stroke="#16A34A" stroke-width="4" stroke-linecap="round" />
      <path d="M68 16 Q82 14 86 24 Q76 28 68 16 Z" fill="#4ADE80" stroke="#16A34A" stroke-width="2" />
      <circle cx="34" cy="65" r="18" fill="#E11D48" />
      <circle cx="28" cy="59" r="5" fill="#FDA4AF" opacity="0.8" />
      <circle cx="68" cy="68" r="18" fill="#BE123C" />
      <circle cx="62" cy="62" r="5" fill="#FDA4AF" opacity="0.8" />
    </svg>`,
  },
  {
    id: 'cute-daisy',
    name: 'Spring Daisy',
    category: 'Cute',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2">
        <ellipse cx="50" cy="22" rx="10" ry="16" />
        <ellipse cx="50" cy="78" rx="10" ry="16" />
        <ellipse cx="22" cy="50" rx="16" ry="10" />
        <ellipse cx="78" cy="50" rx="16" ry="10" />
        <ellipse cx="30" cy="30" rx="14" ry="10" transform="rotate(45 30 30)" />
        <ellipse cx="70" cy="70" rx="14" ry="10" transform="rotate(45 70 70)" />
        <ellipse cx="70" cy="30" rx="14" ry="10" transform="rotate(-45 70 30)" />
        <ellipse cx="30" cy="70" rx="14" ry="10" transform="rotate(-45 30 70)" />
      </g>
      <circle cx="50" cy="50" r="16" fill="#FBBF24" stroke="#F59E0B" stroke-width="2" />
      <circle cx="46" cy="46" r="3" fill="#FEF08A" />
    </svg>`,
  },

  // --- LOVE ---
  {
    id: 'love-double-heart',
    name: 'Twin Hearts',
    category: 'Love',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M45 28 C35 15 15 20 15 40 C15 62 45 78 45 78 C45 78 75 62 75 40 C75 20 55 15 45 28 Z" fill="#FF526C" />
      <path d="M68 40 C60 30 45 34 45 50 C45 68 68 80 68 80 C68 80 91 68 91 50 C91 34 76 30 68 40 Z" fill="#FDA4AF" stroke="#FF526C" stroke-width="2" />
    </svg>`,
  },
  {
    id: 'love-envelope',
    name: 'Love Letter',
    category: 'Love',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="14" y="28" width="72" height="48" rx="8" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="3" />
      <path d="M16 32 L50 56 L84 32" fill="none" stroke="#FB7185" stroke-width="3" stroke-linecap="round" />
      <circle cx="50" cy="56" r="8" fill="#E11D48" />
      <path d="M50 52 C48 49 44 50 44 54 C44 58 50 62 50 62 C50 62 56 58 56 54 C56 50 52 49 50 52 Z" fill="#FFFFFF" />
    </svg>`,
  },
  {
    id: 'love-kiss-mark',
    name: 'Kiss Stamp',
    category: 'Love',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M20 48 Q34 34 50 44 Q66 34 80 48 Q64 54 50 50 Q36 54 20 48 Z" fill="#E11D48" />
      <path d="M24 52 Q36 68 50 68 Q64 68 76 52 Q64 62 50 60 Q36 62 24 52 Z" fill="#BE123C" />
    </svg>`,
  },

  // --- CELEBRATION ---
  {
    id: 'party-popper',
    name: 'Party Popper',
    category: 'Celebration',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M20 80 L38 34 L72 68 Z" fill="#F59E0B" stroke="#D97706" stroke-width="3" />
      <path d="M30 52 L54 76" stroke="#EF4444" stroke-width="4" />
      <path d="M34 42 L64 72" stroke="#3B82F6" stroke-width="4" />
      <circle cx="58" cy="26" r="5" fill="#EF4444" />
      <circle cx="76" cy="40" r="4" fill="#3B82F6" />
      <circle cx="70" cy="18" r="4" fill="#10B981" />
      <rect x="78" y="24" width="7" height="7" rx="1" fill="#8B5CF6" transform="rotate(30 81 27)" />
      <rect x="44" cy="16" width="6" height="6" rx="1" fill="#F59E0B" transform="rotate(15 47 19)" />
    </svg>`,
  },
  {
    id: 'celebration-crown',
    name: 'Gold Crown',
    category: 'Celebration',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M16 68 L24 32 L40 48 L50 24 L60 48 L76 32 L84 68 Z" fill="#FBBF24" stroke="#D97706" stroke-width="3" stroke-linejoin="round" />
      <rect x="16" y="68" width="68" height="8" rx="2" fill="#F59E0B" />
      <circle cx="24" cy="32" r="3.5" fill="#EF4444" />
      <circle cx="50" cy="24" r="4" fill="#3B82F6" />
      <circle cx="76" cy="32" r="3.5" fill="#10B981" />
    </svg>`,
  },
  {
    id: 'celebration-sparkler',
    name: 'Disco Ball',
    category: 'Celebration',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="34" fill="#E2E8F0" stroke="#64748B" stroke-width="2" />
      <line x1="50" y1="6" x2="50" y2="16" stroke="#64748B" stroke-width="3" />
      <path d="M26 38 H74 M20 50 H80 M26 62 H74 M36 20 V80 M50 16 V84 M64 20 V80" stroke="#94A3B8" stroke-width="1.5" />
      <path d="M42 32 L48 38 L42 44 L36 38 Z" fill="#FFFFFF" opacity="0.9" />
      <path d="M60 52 L64 56 L60 60 L56 56 Z" fill="#FFFFFF" opacity="0.9" />
    </svg>`,
  },

  // --- PHOTO & RETRO ---
  {
    id: 'photo-rangefinder',
    name: 'Retro 35mm',
    category: 'Photo',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="14" y="32" width="72" height="46" rx="6" fill="#292524" stroke="#1C1917" stroke-width="3" />
      <rect x="14" y="32" width="72" height="14" fill="#D6D3D1" />
      <circle cx="50" cy="55" r="18" fill="#44403C" stroke="#D6D3D1" stroke-width="3" />
      <circle cx="50" cy="55" r="10" fill="#0284C7" />
      <circle cx="47" cy="52" r="3" fill="#FFFFFF" opacity="0.8" />
      <rect x="66" y="36" width="12" height="7" rx="1.5" fill="#FAFAF9" stroke="#78716C" stroke-width="1.5" />
      <rect x="22" y="26" width="10" height="6" rx="1" fill="#78716C" />
    </svg>`,
  },
  {
    id: 'photo-polaroid-frame',
    name: 'Mini Snap',
    category: 'Photo',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="22" y="16" width="56" height="68" rx="3" fill="#FAF8F5" stroke="#D6D3D1" stroke-width="2.5" />
      <rect x="28" y="22" width="44" height="44" fill="#38BDF8" />
      <circle cx="40" cy="34" r="6" fill="#FBBF24" />
      <path d="M28 58 L42 46 L54 54 L62 48 L72 58 Z" fill="#34D399" />
    </svg>`,
  },
  {
    id: 'photo-smiley-badge',
    name: '70s Smile',
    category: 'Photo',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="#FBBF24" stroke="#1F2937" stroke-width="3.5" />
      <ellipse cx="38" cy="42" rx="4" ry="7" fill="#1F2937" />
      <ellipse cx="62" cy="42" rx="4" ry="7" fill="#1F2937" />
      <path d="M34 58 Q50 74 66 58" fill="none" stroke="#1F2937" stroke-width="4.5" stroke-linecap="round" />
    </svg>`,
  },
];

export const VECTOR_STICKERS: VectorSticker[] = RAW_STICKERS.map(s => ({
  ...s,
  dataUrl: svgToDataUrl(s.svg),
}));
