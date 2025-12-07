import type {
  CaptureEffectOptions,
  CaptureEffectRendererParams,
  CaptureEffectType,
  Square,
} from './types';
import type { NeoChessBoard } from './NeoChessBoard';

interface CaptureEffectBounds {
  left: number;
  top: number;
  size: number;
}

interface CaptureEffectManagerOptions {
  overlayRoot: HTMLElement | null;
  getSquareBounds: (square: Square) => CaptureEffectBounds;
  options?: CaptureEffectOptions;
  board: NeoChessBoard;
}

interface ResolvedCaptureEffectOptions {
  enabled: boolean;
  durationMs: number;
  palette: string[];
  effect: CaptureEffectType;
  renderer?: CaptureEffectOptions['renderer'];
}

type AnimationFrameCallback = (timestamp: number) => void;

const DEFAULT_PALETTE = ['#fbbf24', '#fb923c', '#f472b6', '#c084fc', '#e0f2fe'];
const DEFAULT_DURATION_MS = 700;
const DEFAULT_EFFECT: CaptureEffectType = 'sparkles';

export class CaptureEffectManager {
  private overlayRoot: HTMLElement | null;
  private readonly getSquareBounds: (square: Square) => CaptureEffectBounds;
  private readonly board: NeoChessBoard;
  private options: ResolvedCaptureEffectOptions;
  private activeContainers = new Set<HTMLElement>();
  private cleanupTimers = new Set<ReturnType<typeof setTimeout>>();
  private fallbackSeed = Date.now() % 2_147_483_647;

  constructor({ overlayRoot, getSquareBounds, options, board }: CaptureEffectManagerOptions) {
    this.overlayRoot = overlayRoot;
    this.getSquareBounds = getSquareBounds;
    this.board = board;
    this.options = this.resolveOptions(options);
  }

  public updateOverlayRoot(overlay: HTMLElement | null): void {
    this.overlayRoot = overlay;
  }

  public setOptions(options?: CaptureEffectOptions): void {
    this.options = this.resolveOptions(options);
  }

  public trigger(from: Square, to: Square): void {
    if (!this.options.enabled) {
      return;
    }

    const overlay = this.overlayRoot;
    if (!overlay) {
      return;
    }

    const bounds = this.getSquareBounds(to);
    const container = this.createContainer(bounds);
    overlay.append(container);
    this.activeContainers.add(container);

    const renderer = this.options.renderer ?? ((params) => this.defaultRenderer(params));
    const cleanup = renderer({
      from,
      to,
      overlay,
      container,
      palette: this.options.palette,
      durationMs: this.options.durationMs,
      effect: this.options.effect,
      board: this.board,
    });

    const finalize = () => this.cleanupContainer(container, cleanup);
    const timer = setTimeout(() => {
      this.cleanupTimers.delete(timer);
      finalize();
    }, this.options.durationMs + 50);
    this.cleanupTimers.add(timer);
  }

  public destroy(): void {
    for (const timer of this.cleanupTimers) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();
    for (const container of this.activeContainers) {
      this.cleanupContainer(container);
    }
    this.activeContainers.clear();
  }

  private resolveOptions(options?: CaptureEffectOptions): ResolvedCaptureEffectOptions {
    return {
      enabled: options?.enabled === true,
      durationMs:
        typeof options?.durationMs === 'number' && options.durationMs > 0
          ? Math.floor(options.durationMs)
          : DEFAULT_DURATION_MS,
      palette:
        Array.isArray(options?.palette) && options.palette.length > 0
          ? options.palette.slice(0, 12)
          : DEFAULT_PALETTE,
      effect: options?.effect ?? DEFAULT_EFFECT,
      renderer: options?.renderer,
    };
  }

  private getRandomUnit(): number {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      const MAX_UINT32 = 4_294_967_295;
      return buffer[0] / MAX_UINT32;
    }
    this.fallbackSeed = (this.fallbackSeed * 48_271) % 2_147_483_647;
    return this.fallbackSeed / 2_147_483_647;
  }

  private createContainer(bounds: CaptureEffectBounds): HTMLDivElement {
    const doc = this.overlayRoot?.ownerDocument ?? document;
    const container = doc.createElement('div');
    Object.assign(container.style, {
      position: 'absolute',
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.size}px`,
      height: `${bounds.size}px`,
      pointerEvents: 'none',
      overflow: 'visible',
      transform: 'translate3d(0, 0, 0)',
    });
    return container;
  }

  private cleanupContainer(container: HTMLElement, rendererCleanup?: (() => void) | void): void {
    rendererCleanup?.();
    if (container.isConnected) {
      container.remove();
    }
    this.activeContainers.delete(container);
  }

  private defaultRenderer(params: CaptureEffectRendererParams): void {
    const { container, palette, durationMs, effect } = params;
    const doc = container.ownerDocument ?? document;
    const baseSize = Math.max(container.clientWidth, container.clientHeight, 1);
    const particleCount = effect === 'ripple' ? 6 : 16;
    const radius = effect === 'ripple' ? baseSize * 0.35 : baseSize * 0.55;
    const fadeDuration = Math.max(200, Math.min(durationMs, durationMs * 0.5));
    const schedule: (callback: AnimationFrameCallback) => number =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (fn: AnimationFrameCallback) => Number(setTimeout(fn, 16));

    const particles: HTMLSpanElement[] = [];
    for (let i = 0; i < particleCount; i += 1) {
      const particle = doc.createElement('span');
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = radius * (0.4 + this.getRandomUnit() * 0.6);
      const hue = palette[i % palette.length];
      const size = 6 + this.getRandomUnit() * 10;
      Object.assign(particle.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '999px',
        background: hue,
        opacity: '0',
        transform: 'translate(-50%, -50%) scale(0.5)',
        pointerEvents: 'none',
      });
      container.append(particle);

      const translate = {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      };

      const runAnimation = () => {
        particle.style.transition = `transform ${durationMs}ms ease-out, opacity ${fadeDuration}ms ease-out`;
        particle.style.transform = `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(0.05)`;
        particle.style.opacity = '1';
        schedule(() => {
          particle.style.opacity = '0';
        });
      };

      if (typeof particle.animate === 'function') {
        particle.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.35)', opacity: 0.95 },
            {
              transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(0.05)`,
              opacity: 0,
            },
          ],
          { duration: durationMs, easing: 'ease-out', fill: 'forwards' },
        );
      } else {
        schedule(runAnimation);
      }

      particles.push(particle);
    }

    setTimeout(() => {
      for (const particle of particles) {
        particle.remove();
      }
    }, durationMs + 60);
  }
}
