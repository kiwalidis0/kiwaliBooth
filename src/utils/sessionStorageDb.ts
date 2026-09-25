import type { SavedBoothSession } from '../types/photobooth';

const DB_NAME = 'kiwalibooth_db';
const DB_VERSION = 1;
const STORE_NAME = 'active_session';
const SESSION_KEY = 'latest_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Persist the current photo session to IndexedDB.
 * Safe against the 5MB localStorage limit.
 */
export async function saveSessionToDb(session: SavedBoothSession): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(session, SESSION_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to save session to IndexedDB, attempting sessionStorage fallback:', err);
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    } catch {
      // Ignore fallback errors
    }
  }
}

/**
 * Retrieve the saved session from IndexedDB if not expired.
 */
export async function loadSessionFromDb(): Promise<SavedBoothSession | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SESSION_KEY);

      req.onsuccess = () => {
        const session = req.result as SavedBoothSession | undefined;
        db.close();

        if (!session) {
          resolve(null);
          return;
        }

        // Expire if older than 24 hours
        if (Date.now() - session.timestamp > SESSION_MAX_AGE_MS) {
          clearSessionFromDb().catch(() => {});
          resolve(null);
          return;
        }

        resolve(session);
      };

      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    // Fallback to sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const raw = window.sessionStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw) as SavedBoothSession;
          if (Date.now() - session.timestamp <= SESSION_MAX_AGE_MS) {
            return session;
          }
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }
}

/**
 * Remove saved session from IndexedDB and sessionStorage.
 */
export async function clearSessionFromDb(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(SESSION_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    // Ignore errors
  }

  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Ignore
  }
}
