import type { Square } from '../../src/core/types';

const getHexFallback = (maxExclusive: number): number => {
  const now = Date.now();
  const perf =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? Math.floor(performance.now())
      : 0;
  const combined = now ^ perf;
  return Math.abs(combined) % maxExclusive;
};

type CryptoLike = {
  randomUUID?: () => string;
  getRandomValues?: (
    array: Uint8Array | Uint16Array | Uint32Array,
  ) => Uint8Array | Uint16Array | Uint32Array;
};

const secureRandomIndex = (length: number): number => {
  if (length <= 0) {
    throw new Error('Length must be greater than zero to pick a random element.');
  }

  const globalCrypto =
    typeof globalThis !== 'undefined' && 'crypto' in globalThis
      ? (globalThis.crypto as CryptoLike | undefined)
      : undefined;

  if (globalCrypto) {
    if (typeof globalCrypto.randomUUID === 'function') {
      const segment = globalCrypto.randomUUID().replaceAll('-', '').slice(0, 8);
      const value = Number.parseInt(segment, 16);
      if (Number.isFinite(value)) {
        return value % length;
      }
    }

    if (typeof globalCrypto.getRandomValues === 'function') {
      const buffer = new Uint32Array(1);
      globalCrypto.getRandomValues(buffer);
      return buffer[0] % length;
    }
  }

  return getHexFallback(length);
};

export const pickRandomElement = <T>(items: readonly T[]): T => {
  if (items.length === 0) {
    throw new Error('Cannot pick a random element from an empty array.');
  }

  return items[secureRandomIndex(items.length)];
};

const FILES: readonly string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const randomSquare = (): Square => {
  const file = pickRandomElement(FILES);
  const rank = pickRandomElement(RANKS);
  return `${file}${rank}` as Square;
};
