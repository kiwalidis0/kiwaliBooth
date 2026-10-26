import { describe, it, expect } from 'vitest';
import { isValidHexColor, escapeXml, sanitizeTheme, isSavedBoothSession } from '../validators';
import { DEFAULT_CUSTOM_THEME } from '../../data/templates';
import type { SavedBoothSession, LayoutId } from '../../types/photobooth';

describe('validators', () => {
  describe('isValidHexColor', () => {
    it('accepts valid 6-digit hex colors', () => {
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#F472B6')).toBe(true);
      expect(isValidHexColor('#123456')).toBe(true);
    });

    it('rejects invalid hex formats, names, and injection attempts', () => {
      expect(isValidHexColor('#fff')).toBe(false); // 3-digit not accepted for strict attribute
      expect(isValidHexColor('rgb(255, 0, 0)')).toBe(false);
      expect(isValidHexColor('red')).toBe(false);
      expect(isValidHexColor('#123456; fill: red')).toBe(false);
      expect(isValidHexColor('#123456" fill="black')).toBe(false);
      expect(isValidHexColor(null)).toBe(false);
      expect(isValidHexColor(undefined)).toBe(false);
      expect(isValidHexColor(123456)).toBe(false);
    });
  });

  describe('escapeXml', () => {
    it('escapes xml special characters', () => {
      expect(escapeXml('<script>alert("xss")&\'fun\'</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&amp;&apos;fun&apos;&lt;/script&gt;'
      );
    });

    it('handles non-string or empty inputs safely', () => {
      expect(escapeXml('')).toBe('');
      expect(escapeXml(null)).toBe('');
      expect(escapeXml(undefined)).toBe('');
    });
  });

  describe('sanitizeTheme', () => {
    it('returns valid custom theme when inputs are sound', () => {
      const input = {
        name: 'My Custom Theme',
        description: 'Test description',
        backgroundColor: '#112233',
        borderColor: '#445566',
        textColor: '#778899',
        accentColor: '#AABBCC',
      };
      const sanitized = sanitizeTheme(input);
      expect(sanitized.id).toBe('custom');
      expect(sanitized.theme).toBe('custom');
      expect(sanitized.name).toBe('My Custom Theme');
      expect(sanitized.backgroundColor).toBe('#112233');
      expect(sanitized.borderColor).toBe('#445566');
      expect(sanitized.textColor).toBe('#778899');
      expect(sanitized.accentColor).toBe('#AABBCC');
    });

    it('falls back to DEFAULT_CUSTOM_THEME if any color is invalid or contains quotes', () => {
      const malicious = {
        name: 'Attack',
        backgroundColor: '#FFFFFF',
        borderColor: '#000000',
        textColor: '#000000" onfocus="alert(1)',
        accentColor: '#FF6F61',
      };
      expect(sanitizeTheme(malicious)).toEqual(DEFAULT_CUSTOM_THEME);
    });

    it('falls back to DEFAULT_CUSTOM_THEME for non-object or null input', () => {
      expect(sanitizeTheme(null)).toEqual(DEFAULT_CUSTOM_THEME);
      expect(sanitizeTheme('not-an-object')).toEqual(DEFAULT_CUSTOM_THEME);
    });
  });

  describe('isSavedBoothSession', () => {
    const validSession: SavedBoothSession = {
      step: 'review',
      timestamp: Date.now(),
      selectedLayoutIds: ['classic4'],
      activeStudioLayoutId: 'classic4',
      selectedTemplateId: 'classic-white',
      photos: [
        {
          id: 'photo-1',
          slotIndex: 0,
          dataUrl: 'data:image/jpeg;base64,abc123',
          filter: 'normal',
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          originalWidth: 800,
          originalHeight: 600,
        },
      ],
      stickers: [],
      dateStamp: {
        enabled: true,
        font: 'Fredoka',
        color: '#111116',
        format: 'YYYY.MM.DD',
        customText: '',
      },
      layoutPhotoAssignments: {
        single: [0],
        double: [0, 1],
        triple: [0, 1, 2],
        classic4: [0, 1, 2, 3],
      },
      captureOrientation: 'portrait',
    };

    it('validates a correct session', () => {
      expect(isSavedBoothSession(validSession)).toBe(true);
    });

    it('rejects invalid or missing timestamp', () => {
      expect(isSavedBoothSession({ ...validSession, timestamp: -1 })).toBe(false);
      expect(isSavedBoothSession({ ...validSession, timestamp: '12345' })).toBe(false);
    });

    it('rejects invalid step', () => {
      expect(isSavedBoothSession({ ...validSession, step: 'invalid_step' })).toBe(false);
    });

    it('rejects corrupt photos array', () => {
      expect(isSavedBoothSession({ ...validSession, photos: 'not-an-array' })).toBe(false);
      expect(
        isSavedBoothSession({
          ...validSession,
          photos: [{ ...validSession.photos[0], dataUrl: 'http://unsafe-origin.com/photo.jpg' }],
        })
      ).toBe(false);
    });

    it('rejects corrupt layout IDs', () => {
      expect(
        isSavedBoothSession({ ...validSession, selectedLayoutIds: ['non-existent-layout' as unknown as LayoutId] })
      ).toBe(false);
    });
  });
});
