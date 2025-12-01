import type { EasingFunction } from './types';

export const EASING: Record<string, EasingFunction> & {
  linear: EasingFunction;
  easeInOut: EasingFunction;
  easeOut: EasingFunction;
  elasticOut: EasingFunction;
  backOut: EasingFunction;
} = {
  linear: (t: number) => t,
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOut: (t: number) => t * (2 - t),
  elasticOut: (t: number) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  backOut: (t: number) => {
    // eslint-disable-next-line unicorn/numeric-separators-style
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};
