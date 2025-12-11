const memoryStore = new Map<string, string>();

function hasLocalStorage(): boolean {
  try {
    const testKey = '__puzzle-mode-test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = typeof window !== 'undefined' && hasLocalStorage();

function getStore() {
  return storageAvailable ? window.localStorage : memoryStore;
}

export function loadPuzzleSession<T>(key: string): T | null {
  const store = getStore();
  const raw = storageAvailable ? store.getItem(key) : store.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function savePuzzleSession<T>(key: string, value: T): { persisted: boolean; error?: string } {
  const serialized = JSON.stringify(value);
  const store = getStore();
  try {
    if (storageAvailable) {
      store.setItem(key, serialized);
    } else {
      store.set(key, serialized);
    }
    return { persisted: storageAvailable };
  } catch (error) {
    memoryStore.set(key, serialized);
    return { persisted: false, error: (error as Error).message };
  }
}

export function clearPuzzleSession(key: string): void {
  if (storageAvailable) {
    window.localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}
