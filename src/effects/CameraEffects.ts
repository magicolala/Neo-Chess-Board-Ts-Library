import { clamp } from '../core/utils';
import { EASING } from './easing';
import type {
  CameraEffectsContext,
  CameraEffectsOptions,
  CameraEvent,
  CameraEventPayloadMap,
  CameraTransform,
  ShakeOptions,
  ZoomOptions,
  ZoomTarget,
} from './types';

interface AnimationState {
  from: CameraTransform;
  to: CameraTransform;
  duration: number;
  easing: (t: number) => number;
  start: number;
  resolve: () => void;
  type: 'zoom' | 'reset';
}

interface ActiveShake {
  options: Required<ShakeOptions>;
  start: number;
  resolve: () => void;
}

const DEFAULT_TRANSFORM: CameraTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

const DEFAULT_SHAKE_OPTIONS: Required<ShakeOptions> = {
  intensity: 0.5,
  duration: 400,
  frequency: 30,
  decay: 3,
};

export class CameraEffects {
  private readonly options: Required<CameraEffectsOptions> & { enabled: boolean };
  private readonly context: CameraEffectsContext;
  private transform: CameraTransform = { ...DEFAULT_TRANSFORM };
  private animation: AnimationState | null = null;
  private shakeState: ActiveShake | null = null;
  private raf = 0;
  private lastTime = 0;
  private destroyed = false;
  private shakeOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor(context: CameraEffectsContext, options: CameraEffectsOptions = {}) {
    this.context = context;
    this.options = {
      enabled: options.enabled !== false,
      maxZoom: options.maxZoom ?? 3,
      minZoom: options.minZoom ?? 0.5,
      defaultDuration: options.defaultDuration ?? 600,
      defaultEasing: options.defaultEasing ?? EASING.easeInOut,
    };
  }

  public zoomTo(target: ZoomTarget, options: ZoomOptions = {}): Promise<void> {
    if (!this.options.enabled) return Promise.resolve();

    const viewport = this.context.getViewportSize();
    const padding = options.padding ?? 32;
    const bounds = this.calculateBounds(target, padding);
    const center = bounds?.center ??
      target.center ?? {
        x: viewport.width / 2,
        y: viewport.height / 2,
      };

    const targetScale = this.resolveScale(bounds, target.scale, viewport);
    const next = this.clampTransform(
      {
        x: viewport.width / 2 - center.x,
        y: viewport.height / 2 - center.y,
        scale: targetScale,
        rotation: 0,
      },
      viewport,
    );

    return this.animateTo(next, options.duration, options.easing, 'zoom');
  }

  public shake(
    intensity?: number,
    duration?: number,
    options: Partial<ShakeOptions> = {},
  ): Promise<void> {
    if (!this.options.enabled) return Promise.resolve();

    const merged: Required<ShakeOptions> = {
      ...DEFAULT_SHAKE_OPTIONS,
      intensity: clamp(intensity ?? options.intensity ?? DEFAULT_SHAKE_OPTIONS.intensity, 0, 1),
      duration: duration ?? options.duration ?? DEFAULT_SHAKE_OPTIONS.duration,
      frequency: options.frequency ?? DEFAULT_SHAKE_OPTIONS.frequency,
      decay: options.decay ?? DEFAULT_SHAKE_OPTIONS.decay,
    };

    if (merged.duration <= 0 || merged.intensity <= 0) {
      this.shakeOffset = { x: 0, y: 0 };
      this.context.requestRender();
      return Promise.resolve();
    }

    this.shakeState?.resolve();

    return new Promise((resolve) => {
      this.shakeState = { options: merged, start: performance.now(), resolve };
      this.emit('camera:shake:start', { intensity: merged.intensity, duration: merged.duration });
      this.ensureTicker();
    });
  }

  public reset(animated = false): Promise<void> {
    if (!this.options.enabled) {
      this.transform = { ...DEFAULT_TRANSFORM };
      this.context.requestRender();
      return Promise.resolve();
    }
    this.shakeOffset = { x: 0, y: 0 };
    return this.animateTo({ ...DEFAULT_TRANSFORM }, animated ? undefined : 0, undefined, 'reset');
  }

  public getCurrentTransform(): CameraTransform | null {
    if (!this.options.enabled) {
      return null;
    }

    return {
      ...this.transform,
      x: this.transform.x + this.shakeOffset.x,
      y: this.transform.y + this.shakeOffset.y,
    };
  }

  public isAnimating(): boolean {
    return Boolean(this.animation || this.shakeState);
  }

  public update(): void {
    if (this.destroyed) return;
    this.step(performance.now());
  }

  public destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.animation = null;
    this.shakeState = null;
    this.raf = 0;
  }

  private ensureTicker(): void {
    if (this.raf) return;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      this.step(now);
      this.raf = this.isAnimating() ? requestAnimationFrame(tick) : 0;
    };
    this.raf = requestAnimationFrame(tick);
  }

  private step(now: number): void {
    this.lastTime = now;
    let needsRender = false;

    if (this.animation) {
      const progress = this.animation.duration
        ? clamp((now - this.animation.start) / this.animation.duration, 0, 1)
        : 1;
      const eased = this.animation.easing(progress);
      this.transform = this.interpolate(this.animation.from, this.animation.to, eased);
      needsRender = true;

      if (progress >= 1) {
        this.animation.resolve();
        this.emit(
          this.animation.type === 'reset' ? 'camera:reset' : 'camera:zoom:end',
          this.transform,
        );
        this.animation = null;
      }
    }

    if (this.shakeState) {
      const { options } = this.shakeState;
      const elapsed = now - this.shakeState.start;
      const t = clamp(elapsed / options.duration, 0, 1);
      const amplitude = options.intensity * Math.exp(-options.decay * t);
      const time = elapsed / 1000;
      const base = Math.PI * options.frequency;

      this.shakeOffset = {
        x:
          amplitude *
          10 *
          (Math.sin(time * base * 0.5) * 0.5 +
            Math.sin(time * base * 0.75) * 0.3 +
            Math.sin(time * base * 1.1) * 0.2),
        y:
          amplitude *
          10 *
          (Math.cos(time * base * 0.6) * 0.5 +
            Math.cos(time * base * 0.85) * 0.3 +
            Math.cos(time * base * 1.25) * 0.2),
      };
      needsRender = true;

      if (t >= 1) {
        this.shakeState.resolve();
        this.shakeState = null;
        this.shakeOffset = { x: 0, y: 0 };
        this.emit('camera:shake:end', undefined as unknown as void);
      }
    }

    if (needsRender) {
      this.context.requestRender();
    }
  }

  private calculateBounds(
    target: ZoomTarget,
    padding: number,
  ): { center: { x: number; y: number }; width: number; height: number } | null {
    const squares = target.squares ?? (target.square ? [target.square] : []);
    const hasSquares = squares.length > 0;

    if (!hasSquares && !target.center) {
      return null;
    }

    if (target.center && !hasSquares) {
      return { center: target.center, width: padding * 2, height: padding * 2 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const square of squares) {
      const bounds = this.context.getSquareBounds(square);
      if (!bounds) continue;
      minX = Math.min(minX, bounds.x - padding);
      minY = Math.min(minY, bounds.y - padding);
      maxX = Math.max(maxX, bounds.x + bounds.size + padding);
      maxY = Math.max(maxY, bounds.y + bounds.size + padding);
    }

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      return null;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const center = { x: minX + width / 2, y: minY + height / 2 };

    return { center, width, height };
  }

  private resolveScale(
    bounds: { width: number; height: number } | null,
    targetScale: number | undefined,
    viewport: { width: number; height: number },
  ): number {
    const desired = targetScale ?? 1;
    const fit = bounds
      ? Math.min(
          viewport.width / Math.max(bounds.width, 1),
          viewport.height / Math.max(bounds.height, 1),
        )
      : desired;
    const scale = Math.min(desired, fit);
    return clamp(scale, this.options.minZoom, this.options.maxZoom);
  }

  private clampTransform(
    transform: CameraTransform,
    viewport: { width: number; height: number },
  ): CameraTransform {
    const maxOffsetX =
      Math.abs((transform.scale - 1) * viewport.width) / (2 * Math.max(transform.scale, 0.0001));
    const maxOffsetY =
      Math.abs((transform.scale - 1) * viewport.height) / (2 * Math.max(transform.scale, 0.0001));

    return {
      ...transform,
      x: clamp(transform.x, -maxOffsetX, maxOffsetX),
      y: clamp(transform.y, -maxOffsetY, maxOffsetY),
      scale: clamp(transform.scale, this.options.minZoom, this.options.maxZoom),
    };
  }

  private interpolate(from: CameraTransform, to: CameraTransform, t: number): CameraTransform {
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      scale: from.scale + (to.scale - from.scale) * t,
      rotation: from.rotation + (to.rotation - from.rotation) * t,
    };
  }

  private animateTo(
    target: CameraTransform,
    duration = this.options.defaultDuration,
    easing = this.options.defaultEasing,
    type: AnimationState['type'],
  ): Promise<void> {
    this.animation?.resolve();
    this.animation = null;

    if (duration <= 0) {
      this.transform = target;
      if (type === 'reset') {
        this.emit('camera:reset', this.transform);
      } else {
        this.emit('camera:zoom:end', this.transform);
      }
      this.context.requestRender();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.animation = {
        from: { ...this.transform },
        to: target,
        duration,
        easing,
        start: performance.now(),
        resolve,
        type,
      };
      this.emit(type === 'reset' ? 'camera:reset' : 'camera:zoom:start', target);
      this.ensureTicker();
    });
  }

  private emit<K extends CameraEvent>(event: K, payload: CameraEventPayloadMap[K]): void {
    if (this.context.emit) {
      this.context.emit(event, payload);
    }
  }
}
