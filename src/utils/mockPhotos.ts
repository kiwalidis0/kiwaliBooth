/**
 * Generates lightweight, beautiful, 100% self-contained cute photobooth portraits.
 * No external network requests, zero CORS issues, instant loading, never taints canvas.
 */
export function createMockSelfie(themeIndex: number): string {
  const themes = [
    {
      bg: '#FFE8EC',
      accent: '#FF8DA1',
      shirt: '#F43F5E',
      hair: '#3E2723',
      skin: '#FFDFBA',
      faceEmoji: '✨',
      caption: 'POSE 1',
    },
    {
      bg: '#E0F2FE',
      accent: '#38BDF8',
      shirt: '#0284C7',
      hair: '#1E293B',
      skin: '#FFE0BD',
      faceEmoji: '🎀',
      caption: 'POSE 2',
    },
    {
      bg: '#FEF3C7',
      accent: '#F59E0B',
      shirt: '#D97706',
      hair: '#4A3B32',
      skin: '#FFDFC4',
      faceEmoji: '🌸',
      caption: 'POSE 3',
    },
    {
      bg: '#F3E8FF',
      accent: '#C084FC',
      shirt: '#9333EA',
      hair: '#1F2937',
      skin: '#FFDFBA',
      faceEmoji: '💖',
      caption: 'POSE 4',
    },
  ];

  const t = themes[themeIndex % themes.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="${t.bg}"/>
    <!-- Soft gradient glow in background -->
    <circle cx="300" cy="225" r="180" fill="${t.accent}" opacity="0.25"/>
    
    <!-- Torso / Shirt -->
    <path d="M 180 450 C 180 340, 420 340, 420 450 Z" fill="${t.shirt}"/>
    <path d="M 270 340 L 300 375 L 330 340 Z" fill="${t.skin}"/>
    
    <!-- Head / Neck -->
    <rect x="280" y="270" width="40" height="50" rx="10" fill="${t.skin}"/>
    <circle cx="300" cy="215" r="105" fill="${t.skin}"/>
    
    <!-- Hair -->
    <path d="M 185 210 C 185 100, 415 100, 415 210 C 390 145, 210 145, 185 210 Z" fill="${t.hair}"/>
    <path d="M 195 190 Q 240 230, 275 190" stroke="${t.hair}" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M 325 190 Q 360 230, 405 190" stroke="${t.hair}" stroke-width="16" stroke-linecap="round" fill="none"/>

    <!-- Eyes (Cute anime sparkle) -->
    <circle cx="260" cy="210" r="8" fill="#1C1917"/>
    <circle cx="263" cy="207" r="2.5" fill="#FFFFFF"/>
    <circle cx="340" cy="210" r="8" fill="#1C1917"/>
    <circle cx="343" cy="207" r="2.5" fill="#FFFFFF"/>

    <!-- Soft Cheek Blush -->
    <ellipse cx="240" cy="235" rx="16" ry="8" fill="${t.accent}" opacity="0.6"/>
    <ellipse cx="360" cy="235" rx="16" ry="8" fill="${t.accent}" opacity="0.6"/>

    <!-- Cute Smile -->
    <path d="M 285 240 Q 300 258, 315 240" stroke="#1C1917" stroke-width="3.5" stroke-linecap="round" fill="none"/>

    <!-- Sparkle floating decoration -->
    <text x="390" y="160" font-size="28">${t.faceEmoji}</text>

    <!-- Subtle footer label -->
    <rect x="200" y="405" width="200" height="26" rx="13" fill="#FFFFFF" opacity="0.85"/>
    <text x="300" y="422" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="11" fill="#44403C" text-anchor="middle" letter-spacing="1">${t.caption}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MOCK_SELFIE_LIST = [0, 1, 2, 3].map(i => createMockSelfie(i));
