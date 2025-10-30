import type { Theme } from './types';
export class FlatSprites {
  private sheet: HTMLCanvasElement | OffscreenCanvas;
  constructor(
    private size: number,
    private colors: Theme,
  ) {
    this.sheet = this.build(size);
  }
  getSheet() {
    return this.sheet;
  }
  private rr(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }
  private build(px: number) {
    const c =
      typeof OffscreenCanvas === 'undefined'
        ? Object.assign(document.createElement('canvas'), { width: px * 6, height: px * 2 })
        : new OffscreenCanvas(px * 6, px * 2);
    const ctx = c.getContext('2d')!;
    const order = ['k', 'q', 'r', 'b', 'n', 'p'] as const;
    for (const [i, t] of order.entries()) {
      this.draw(ctx, i * px, 0, px, t, 'black');
      this.draw(ctx, i * px, px, px, t, 'white');
    }
    return c;
  }
  private draw(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    type: string,
    color: 'white' | 'black',
  ) {
    const C = color === 'white' ? this.colors.whitePiece : this.colors.blackPiece;
    const S = this.colors.pieceShadow;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = S;
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.68, s * 0.28, s * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const base = () => {
      ctx.beginPath();
      ctx.moveTo(s * 0.2, s * 0.7);
      ctx.quadraticCurveTo(s * 0.5, s * 0.6, s * 0.8, s * 0.7);
      ctx.lineTo(s * 0.8, s * 0.8);
      ctx.quadraticCurveTo(s * 0.5, s * 0.85, s * 0.2, s * 0.8);
      ctx.closePath();
      ctx.fill();
    };
    if (type === 'p') {
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.38, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.38, s * 0.52);
      ctx.quadraticCurveTo(s * 0.5, s * 0.42, s * 0.62, s * 0.52);
      ctx.quadraticCurveTo(s * 0.64, s * 0.6, s * 0.5, s * 0.62);
      ctx.quadraticCurveTo(s * 0.36, s * 0.6, s * 0.38, s * 0.52);
      ctx.closePath();
      ctx.fill();
      base();
    }
    if (type === 'r') {
      ctx.beginPath();
      this.rr(ctx, s * 0.32, s * 0.3, s * 0.36, s * 0.34, s * 0.04);
      ctx.fill();
      ctx.beginPath();
      this.rr(ctx, s * 0.3, s * 0.22, s * 0.12, s * 0.1, s * 0.02);
      ctx.fill();
      ctx.beginPath();
      this.rr(ctx, s * 0.44, s * 0.2, s * 0.12, s * 0.12, s * 0.02);
      ctx.fill();
      ctx.beginPath();
      this.rr(ctx, s * 0.58, s * 0.22, s * 0.12, s * 0.1, s * 0.02);
      ctx.fill();
      base();
    }
    if (type === 'n') {
      ctx.beginPath();
      ctx.moveTo(s * 0.64, s * 0.6);
      ctx.quadraticCurveTo(s * 0.7, s * 0.35, s * 0.54, s * 0.28);
      ctx.quadraticCurveTo(s * 0.46, s * 0.24, s * 0.44, s * 0.3);
      ctx.quadraticCurveTo(s * 0.42, s * 0.42, s * 0.34, s * 0.44);
      ctx.quadraticCurveTo(s * 0.3, s * 0.46, s * 0.28, s * 0.5);
      ctx.quadraticCurveTo(s * 0.26, s * 0.6, s * 0.38, s * 0.62);
      ctx.closePath();
      ctx.fill();
      const originalFillStyle = ctx.fillStyle;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.36, s * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = originalFillStyle;
      base();
    }
    if (type === 'b') {
      ctx.beginPath();
      ctx.ellipse(s * 0.5, s * 0.42, s * 0.12, s * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      const C = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.28);
      ctx.lineTo(s * 0.5, s * 0.52);
      ctx.lineWidth = s * 0.04;
      ctx.stroke();
      ctx.globalCompositeOperation = C;
      base();
    }
    if (type === 'q') {
      ctx.beginPath();
      ctx.moveTo(s * 0.3, s * 0.3);
      ctx.lineTo(s * 0.4, s * 0.18);
      ctx.lineTo(s * 0.5, s * 0.3);
      ctx.lineTo(s * 0.6, s * 0.18);
      ctx.lineTo(s * 0.7, s * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * 0.5, s * 0.5, s * 0.16, s * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      base();
    }
    if (type === 'k') {
      ctx.beginPath();
      this.rr(ctx, s * 0.47, s * 0.16, s * 0.06, s * 0.16, s * 0.02);
      ctx.fill();
      ctx.beginPath();
      this.rr(ctx, s * 0.4, s * 0.22, s * 0.2, s * 0.06, s * 0.02);
      ctx.fill();
      ctx.beginPath();
      this.rr(ctx, s * 0.36, s * 0.34, s * 0.28, s * 0.26, s * 0.08);
      ctx.fill();
      base();
    }
    ctx.restore();
  }
}
