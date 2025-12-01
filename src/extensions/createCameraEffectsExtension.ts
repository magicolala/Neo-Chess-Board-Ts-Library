import type { CameraEventPayloadMap } from '../effects/types';
import type { ExtensionConfig, ExtensionContext } from '../core/types';

export interface CameraEffectsExtensionOptions {
  zoomOnMove?: boolean;
  zoomScale?: number;
  resetAfterMoveMs?: number;
  onCameraEvent?: <K extends keyof CameraEventPayloadMap>(
    event: K,
    payload: CameraEventPayloadMap[K],
  ) => void;
}

export interface CameraEffectsExtensionConfig extends CameraEffectsExtensionOptions {
  id?: string;
}

export function createCameraEffectsExtension(
  config: CameraEffectsExtensionConfig = {},
): ExtensionConfig<CameraEffectsExtensionOptions> {
  const { id, ...options } = config;

  return {
    id: id ?? 'camera-effects',
    options,
    create(_context: ExtensionContext<CameraEffectsExtensionOptions>) {
      const disposers: Array<() => void> = [];

      return {
        onInit(ctx) {
          if (options.onCameraEvent) {
            (
              [
                'camera:zoom:start',
                'camera:zoom:end',
                'camera:shake:start',
                'camera:shake:end',
                'camera:reset',
              ] as const
            ).forEach((event) => {
              const dispose = ctx.registerExtensionPoint(event, (payload) => {
                options.onCameraEvent?.(event, payload);
              });
              disposers.push(dispose);
            });
          }

          if (options.zoomOnMove) {
            const dispose = ctx.registerExtensionPoint('move', async ({ from, to }) => {
              await ctx.board.zoomToMove(from, to, options.zoomScale ?? 1.8);
              if (typeof options.resetAfterMoveMs === 'number') {
                setTimeout(() => {
                  ctx.board.resetCamera(true).catch(() => {});
                }, options.resetAfterMoveMs);
              }
            });
            disposers.push(dispose);
          }
        },
        onDestroy() {
          disposers.splice(0).forEach((dispose) => dispose());
        },
      };
    },
  };
}
