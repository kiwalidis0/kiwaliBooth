import type { TemplateConfig } from '../types/photobooth';

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'classic-white',
    name: 'Classic Minimal',
    description: 'Clean authentic studio white with crisp borders',
    theme: 'white',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    textColor: '#111116',
    accentColor: '#FF6F61',
  },
  {
    id: 'playful-blocks',
    name: 'Kiwali Pop',
    description: 'Playful colorblocks with punchy coral and sunny yellow',
    theme: 'colorblocks',
    backgroundColor: '#FFFBEB',
    borderColor: '#111116',
    textColor: '#111116',
    accentColor: '#FF6F61',
  },
  {
    id: 'pastel-cloud',
    name: 'Pastel Dream',
    description: 'Dreamy soft lavender and strawberry milk gradient aesthetic',
    theme: 'pastel',
    backgroundColor: '#FAF5FF',
    borderColor: '#F3E8FF',
    textColor: '#7E22CE',
    accentColor: '#C084FC',
  },
  {
    id: 'film-noir',
    name: 'Retro Film Noir',
    description: 'Deep midnight frame with authentic film strip borders and barcode',
    theme: 'noir',
    backgroundColor: '#121216',
    borderColor: '#26262E',
    textColor: '#F8FAFC',
    accentColor: '#FFD166',
  },
  {
    id: 'custom-canva',
    name: 'Custom Canva Frame',
    description: 'Upload your own transparent PNG overlay designed in Canva',
    theme: 'custom',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: '#111116',
    accentColor: '#118AB2',
  },
];

export const STICKER_PRESETS = [
  '✨', '💖', '🎀', '⭐', '🌸', '🧸', '🐰', '🍒', '🦋', '🥑', '🕶️', '🔥', '📸', '💌', '🐱', '🍕'
];
