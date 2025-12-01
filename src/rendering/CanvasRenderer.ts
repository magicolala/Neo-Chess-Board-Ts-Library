import type { CameraTransform } from '../effects/types';

export class CanvasRenderer {
  constructor(private readonly getTransform: () => CameraTransform | null) {}

  applyCameraTransform(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    transformOverride?: CameraTransform | null,
  ): CameraTransform | null {
    const transform = transformOverride ?? this.getTransform();
    if (!transform) return null;

    const supportsTransforms =
      typeof ctx.save === 'function' &&
      typeof ctx.restore === 'function' &&
      typeof ctx.translate === 'function' &&
      typeof ctx.scale === 'function' &&
      typeof ctx.rotate === 'function';

    if (!supportsTransforms) return null;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(transform.scale, transform.scale);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2 + transform.x, -canvas.height / 2 + transform.y);
    return transform;
  }

  restore(ctx: CanvasRenderingContext2D, applied: CameraTransform | null): void {
    if (applied && typeof ctx.restore === 'function') {
      ctx.restore();
    }
  }
}
