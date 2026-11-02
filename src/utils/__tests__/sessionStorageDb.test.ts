import { describe, it, expect, beforeEach } from 'vitest';
import { loadSessionFromDb, clearSessionFromDb, SESSION_MAX_AGE_MS } from '../sessionStorageDb';
import type { SavedBoothSession } from '../../types/photobooth';

describe('sessionStorageDb fallback', () => {
  const SESSION_KEY = 'latest_session';
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockSessionStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, val: string) => {
        mockStore[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };

    (globalThis as unknown as { window: unknown }).window = {
      sessionStorage: mockSessionStorage,
      indexedDB: undefined, // trigger fallback path cleanly
    };
  });

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

  it('loads valid session from storage', async () => {
    mockStore[SESSION_KEY] = JSON.stringify(validSession);
    const loaded = await loadSessionFromDb();
    expect(loaded).not.toBeNull();
    expect(loaded?.step).toBe('review');
    expect(loaded?.photos).toHaveLength(1);
  });

  it('purges and returns null for expired session', async () => {
    const expiredSession = {
      ...validSession,
      timestamp: Date.now() - (SESSION_MAX_AGE_MS + 10000),
    };
    mockStore[SESSION_KEY] = JSON.stringify(expiredSession);

    const loaded = await loadSessionFromDb();
    expect(loaded).toBeNull();
    expect(mockStore[SESSION_KEY]).toBeUndefined(); // Verified purged
  });

  it('purges and returns null for corrupted session data', async () => {
    mockStore[SESSION_KEY] = JSON.stringify({
      corrupt: true,
      step: 'invalid_step_name',
    });

    const loaded = await loadSessionFromDb();
    expect(loaded).toBeNull();
    expect(mockStore[SESSION_KEY]).toBeUndefined(); // Verified purged
  });

  it('clears session with clearSessionFromDb', async () => {
    mockStore[SESSION_KEY] = JSON.stringify(validSession);
    await clearSessionFromDb();
    expect(mockStore[SESSION_KEY]).toBeUndefined();
  });
});
