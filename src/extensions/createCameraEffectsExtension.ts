import type { CameraEventPayloadMap } from '../effects/types';
import type { ExtensionConfig, ExtensionContext } from '../core/types';

type DisposeList = Array<() => void>;

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

const registerCameraEvents = (
  ctx: ExtensionContext<CameraEffectsExtensionOptions>,
  options: CameraEffectsExtensionOptions,
  disposers: DisposeList,
) => {
  if (!options.onCameraEvent) {
    return;
  }
  const eventKeys: Array<keyof CameraEventPayloadMap> = [
    'camera:zoom:start',
    'camera:zoom:end',
    'camera:shake:start',
    'camera:shake:end',
    'camera:reset',
  ];
  for (const event of eventKeys) {
    const dispose = ctx.registerExtensionPoint(event, (payload) => {
      options.onCameraEvent?.(event, payload);
    });
    disposers.push(dispose);
  }
};

const registerZoomOnMove = (
  ctx: ExtensionContext<CameraEffectsExtensionOptions>,
  options: CameraEffectsExtensionOptions,
  disposers: DisposeList,
) => {
  if (!options.zoomOnMove) {
    return;
  }
  const dispose = ctx.registerExtensionPoint('move', async ({ from, to }) => {
    await ctx.board.zoomToMove(from, to, options.zoomScale ?? 1.8);
    if (typeof options.resetAfterMoveMs === 'number') {
      setTimeout(() => {
        ctx.board.resetCamera(true).catch(() => {});
      }, options.resetAfterMoveMs);
    }
  });
  disposers.push(dispose);
};

export function createCameraEffectsExtension(
  config: CameraEffectsExtensionConfig = {},
): ExtensionConfig<CameraEffectsExtensionOptions> {
  const { id, ...options } = config;

  return {
    id: id ?? 'camera-effects',
    options,
    create(_context: ExtensionContext<CameraEffectsExtensionOptions>) {
      const disposers: DisposeList = [];

      return {
        onInit(ctx) {
          registerCameraEvents(ctx, options, disposers);
          registerZoomOnMove(ctx, options, disposers);
        },
        onDestroy() {
          disposers.splice(0).forEach((dispose) => dispose());
        },
      };
    },
  };
}
