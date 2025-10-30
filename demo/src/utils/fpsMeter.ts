export interface FpsMeter {
  start(): void;
  stop(): void;
  subscribe(listener: (fps: number) => void): () => void;
  getValue(): number | null;
}

export interface FpsMeterOptions {
  smoothing?: number;
  sampleIntervalMs?: number;
}

const now = (): number => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

export const createFpsMeter = ({
  smoothing = 0.25,
  sampleIntervalMs = 250,
}: FpsMeterOptions = {}): FpsMeter => {
  const listeners = new Set<(fps: number) => void>();
  let rafId: number | null = null;
  let running = false;
  let frameCount = 0;
  let lastSample = 0;
  let currentValue: number | null = null;

  const notify = (value: number) => {
    for (const listener of listeners) {
      listener(value);
    }
  };

  const tick = (timestamp: number) => {
    if (!running) {
      return;
    }

    if (lastSample === 0) {
      lastSample = timestamp || now();
      frameCount = 0;
    }

    frameCount += 1;
    const elapsed = timestamp - lastSample;

    if (elapsed >= sampleIntervalMs) {
      const rawFps = (frameCount * 1000) / (elapsed || 1);
      currentValue =
        currentValue === null ? rawFps : currentValue + (rawFps - currentValue) * smoothing;
      const rounded = Math.max(0, Math.round(currentValue));
      notify(rounded);
      frameCount = 0;
      lastSample = timestamp;
    }

    rafId = globalThis.requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) {
      return;
    }
    if (globalThis.window === undefined || typeof globalThis.requestAnimationFrame !== 'function') {
      return;
    }

    running = true;
    frameCount = 0;
    lastSample = 0;
    rafId = globalThis.requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!running) {
      return;
    }
    running = false;
    if (
      globalThis.window !== undefined &&
      typeof globalThis.cancelAnimationFrame === 'function' &&
      rafId !== null
    ) {
      globalThis.cancelAnimationFrame(rafId);
    }
    rafId = null;
    frameCount = 0;
    lastSample = 0;
  };

  const subscribe = (listener: (fps: number) => void): (() => void) => {
    listeners.add(listener);
    if (currentValue !== null) {
      listener(Math.max(0, Math.round(currentValue)));
    }
    return () => {
      listeners.delete(listener);
    };
  };

  const getValue = (): number | null => {
    return currentValue === null ? null : Math.max(0, Math.round(currentValue));
  };

  return { start, stop, subscribe, getValue };
};
