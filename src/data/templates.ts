import type { TemplateConfig } from '../types/photobooth';

export const TEMPLATES: TemplateConfig[] = [
  // ─────────────────────────────────────────────
  // CLASSIC
  // ─────────────────────────────────────────────
  {
    id: 'classic-white',
    name: 'Classic White',
    description: 'Clean white photobooth print with simple borders and timeless styling',
    theme: 'white',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    textColor: '#111116',
    accentColor: '#FF6F61',
  },

  // ─────────────────────────────────────────────
  // INSTANT FILM
  // ─────────────────────────────────────────────
  {
    id: 'polaroid-cream',
    name: 'Instant Polaroid',
    description: 'Warm instant-film paper with a clean frame and nostalgic print feel',
    theme: 'polaroid',
    backgroundColor: '#FAF7F2',
    borderColor: '#E7DFD5',
    textColor: '#2D2825',
    accentColor: '#B77945',
  },

  // ─────────────────────────────────────────────
  // ANALOG FILM
  // ─────────────────────────────────────────────
  {
    id: 'filmstrip-35mm',
    name: '35mm Negative',
    description: 'Dark analog film with sprocket holes, frame numbers, and negative-strip details',
    theme: 'filmstrip',
    backgroundColor: '#111113',
    borderColor: '#29292F',
    textColor: '#F5F5F4',
    accentColor: '#F5B942',
  },

  // ─────────────────────────────────────────────
  // EDITORIAL
  // ─────────────────────────────────────────────
  {
    id: 'minimal-studio',
    name: 'Editorial',
    description: 'Quiet gallery-inspired layout with fine borders and generous white space',
    theme: 'minimal',
    backgroundColor: '#FAFAF9',
    borderColor: '#D6D3D1',
    textColor: '#1C1917',
    accentColor: '#78716C',
  },

  // ─────────────────────────────────────────────
  // RETRO 90s
  // ─────────────────────────────────────────────
  {
    id: 'retro-90s',
    name: 'Disposable 90s',
    description: 'Warm disposable-camera colors with nostalgic grain and imperfect analog character',
    theme: 'retro90',
    backgroundColor: '#F4EBDD',
    borderColor: '#DCCBB7',
    textColor: '#594335',
    accentColor: '#C65F45',
  },

  // ─────────────────────────────────────────────
  // CUTE / HAND-DRAWN
  // ─────────────────────────────────────────────
  {
    id: 'pastel-doodles',
    name: 'Pastel Doodles',
    description: 'Playful hand-drawn details with soft pinks and cute scrapbook energy',
    theme: 'doodles',
    backgroundColor: '#FFF7FA',
    borderColor: '#F5D9E3',
    textColor: '#8F3158',
    accentColor: '#F27BA9',
  },

  // ─────────────────────────────────────────────
  // SIGNATURE
  // ─────────────────────────────────────────────
  {
    id: 'playful-blocks',
    name: 'Kiwali Pop',
    description: 'Bold playful blocks with punchy coral, sunny yellow, and a cheerful personality',
    theme: 'colorblocks',
    backgroundColor: '#FFF9E8',
    borderColor: '#18181B',
    textColor: '#18181B',
    accentColor: '#FF6F61',
  },

  // ─────────────────────────────────────────────
  // DREAMY
  // ─────────────────────────────────────────────
  {
    id: 'pastel-cloud',
    name: 'Pastel Dream',
    description: 'Soft lavender and strawberry-milk tones inspired by dreamy stationery and stickers',
    theme: 'pastel',
    backgroundColor: '#FBF7FF',
    borderColor: '#E9DDF7',
    textColor: '#713F8F',
    accentColor: '#C084FC',
  },

  // ─────────────────────────────────────────────
  // CINEMATIC
  // ─────────────────────────────────────────────
  {
    id: 'film-noir',
    name: 'Midnight Film',
    description: 'Moody black film styling with warm highlights and cinematic analog details',
    theme: 'noir',
    backgroundColor: '#111113',
    borderColor: '#2C2C32',
    textColor: '#F5F5F4',
    accentColor: '#FFD166',
  },

  // ─────────────────────────────────────────────
  // CUSTOM
  // ─────────────────────────────────────────────
  {
    id: 'custom-canva',
    name: 'Custom Canva Frame',
    description: 'Use your own transparent PNG overlay designed in Canva',
    theme: 'custom',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: '#111116',
    accentColor: '#118AB2',
  },
];

export const DEFAULT_CUSTOM_THEME: TemplateConfig = {
  id: 'custom',
  name: 'Custom Theme',
  description: 'Your personalized colors and style',
  theme: 'custom',
  backgroundColor: '#FFF0F5',
  borderColor: '#FFD1DC',
  textColor: '#4A154B',
  accentColor: '#FF6F61',
};

export const STICKER_PRESETS = [
  '✨', '💖', '🎀', '⭐', '🌸', '🧸', '🐰', '🍒', '🦋', '🥑', '🕶️', '🔥',
  '📸', '💌', '🐱', '🍕', '🍰', '🎉', '🥂', '💐', '🍓', '🍭', '🧁', '🌻',
  '🐣', '🐶', '🦄', '🌈', '⚡', '🌙', '💫', '☀️', '🎈', '🎂', '👑', '💎',
  '💄', '💋', '✌️', '🫰', '🥰', '🥳', '😎', '🥹', '🫶', '❤️‍🔥', '🤍', '🎬'
];

