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

export function loadPuzzleSession<T>(key: string): T | null {
  const raw = storageAvailable ? window.localStorage.getItem(key) : memoryStore.get(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function savePuzzleSession<T>(key: string, value: T): { persisted: boolean; error?: string } {
  const serialized = JSON.stringify(value);
  try {
    if (storageAvailable) {
      window.localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
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
