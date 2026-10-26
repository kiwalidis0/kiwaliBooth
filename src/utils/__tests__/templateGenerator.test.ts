import { describe, it, expect } from 'vitest';
import { generateTemplateOverlaySvg } from '../templateGenerator';
import type { LayoutConfig, TemplateConfig } from '../../types/photobooth';

describe('generateTemplateOverlaySvg', () => {
  const dummyLayout: LayoutConfig = {
    id: 'classic4',
    name: 'Classic 4',
    subtitle: '4 shots',
    shotsCount: 4,
    width: 600,
    height: 1800,
    slots: [],
  };

  it('generates a valid svg data URL for built-in template', () => {
    const template: TemplateConfig = {
      id: 'classic-white',
      name: 'Classic White',
      description: 'Clean white border',
      theme: 'white',
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      textColor: '#1E293B',
      accentColor: '#3B82F6',
    };

    const dataUrl = generateTemplateOverlaySvg(dummyLayout, template);
    expect(dataUrl.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    const decoded = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('kiwalibooth');
  });

  it('sanitizes malicious color injection in custom theme', () => {
    const maliciousTemplate: TemplateConfig = {
      id: 'custom',
      name: 'Exploit',
      description: 'Test',
      theme: 'custom',
      backgroundColor: '#FFFFFF',
      borderColor: '#000000',
      textColor: '#000000',
      accentColor: '#123456" onmouseover="alert(1)',
    };

    const dataUrl = generateTemplateOverlaySvg(dummyLayout, maliciousTemplate);
    const decoded = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
    // Malicious accentColor must be rejected and replaced with safe fallback #1C1917
    expect(decoded).not.toContain('onmouseover');
    expect(decoded).toContain('fill="#1C1917"');
  });

  it('escapes xml markers in filmstrip template', () => {
    const filmstripTemplate: TemplateConfig = {
      id: 'filmstrip',
      name: 'Filmstrip',
      description: 'Analog style',
      theme: 'filmstrip',
      backgroundColor: '#1E1E24',
      borderColor: '#2A2A32',
      textColor: '#F59E0B',
      accentColor: '#F59E0B',
    };

    const dataUrl = generateTemplateOverlaySvg(dummyLayout, filmstripTemplate);
    const decoded = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
    expect(decoded).toContain('&gt; 24A');
    expect(decoded).toContain('25 &gt;&gt;');
  });
});
