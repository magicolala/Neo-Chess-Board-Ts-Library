import type { Theme } from './types';

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export class FlatSprites {
  private sheet: HTMLCanvasElement | OffscreenCanvas;
  private dpr = (globalThis as any).devicePixelRatio || 1;

  constructor(
    private size: number,
    private colors: Theme,
  ) {
    this.sheet = this.build(size);
  }

  getSheet() {
    return this.sheet;
  }

  /** Rounded-rect path */
  private rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
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

  private build(px: number): HTMLCanvasElement | OffscreenCanvas {
    const width = px * 6,
      height = px * 2;

    const c =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width * this.dpr, height * this.dpr)
        : Object.assign(document.createElement('canvas'), {
            width: width * this.dpr,
            height: height * this.dpr,
            style: { width: `${width}px`, height: `${height}px` } as any,
          });

    const ctx = c.getContext('2d')!;
    if (!ctx) throw new Error('Could not get 2D context');

    // retina scaling
    ctx.scale(this.dpr, this.dpr);

    const order = ['k', 'q', 'r', 'b', 'n', 'p'] as const;
    order.forEach((t, i) => {
      this.draw(ctx, i * px, 0, px, t, 'black');
      this.draw(ctx, i * px, px, px, t, 'white');
    });
    return c;
  }

  private draw(ctx: Ctx, x: number, y: number, s: number, type: string, color: 'white' | 'black') {
    const base = color === 'white' ? this.colors.whitePiece : this.colors.blackPiece;
    const stroke = this.colors.pieceStroke ?? 'rgba(0,0,0,0.25)';
    const shadowColor = this.colors.pieceShadow ?? 'rgba(0,0,0,0.2)';
    const highlight = this.colors.pieceHighlight ?? 'rgba(255,255,255,0.55)';

    // subtle vertical gradient for volume
    const grd = (c: string) => {
      const g = (ctx as CanvasRenderingContext2D).createLinearGradient(
        0,
        y + s * 0.1,
        0,
        y + s * 0.85,
      );
      g.addColorStop(0, this.mix(c, '#ffffff', 0.12));
      g.addColorStop(0.5, c);
      g.addColorStop(1, this.mix(c, '#000000', 0.1));
      return g;
    };

    ctx.save();
    ctx.translate(x, y);

    // soft ground shadow
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.86, s * 0.36, s * 0.11, 0, 0, 2 * Math.PI);
    ctx.fill();

    // piece shape
    const path = new Path2D();
    switch (type) {
      case 'p':
        this.pathPawn(path, s);
        break;
      case 'r':
        this.pathRook(path, s);
        break;
      case 'n':
        this.pathKnight(path, s);
        break;
      case 'b':
        this.pathBishop(path, s);
        break;
      case 'q':
        this.pathQueen(path, s);
        break;
      case 'k':
        this.pathKing(path, s);
        break;
    }

    // fill + outline
    (ctx as CanvasRenderingContext2D).fillStyle = grd(base);
    (ctx as CanvasRenderingContext2D).strokeStyle = stroke;
    (ctx as CanvasRenderingContext2D).lineWidth = Math.max(1, s * 0.03);
    (ctx as CanvasRenderingContext2D).lineJoin = 'round';
    (ctx as CanvasRenderingContext2D).lineCap = 'round';
    (ctx as CanvasRenderingContext2D).fill(path);
    (ctx as CanvasRenderingContext2D).stroke(path);

    // top highlight
    ctx.save();
    (ctx as CanvasRenderingContext2D).globalCompositeOperation = 'lighter';
    (ctx as CanvasRenderingContext2D).fillStyle = highlight;
    const hl = new Path2D();
    hl.ellipse(s * 0.5, s * 0.28, s * 0.22, s * 0.08, 0.1, 0, Math.PI * 2);
    (ctx as CanvasRenderingContext2D).fill(hl);
    ctx.restore();

    ctx.restore();
  }

  // ====== PATHS (proportions modernisées) ======

  private pathBase(p: Path2D, s: number) {
    // base double socle
    const b = new Path2D();
    b.moveTo(s * 0.18, s * 0.78);
    b.quadraticCurveTo(s * 0.5, s * 0.93, s * 0.82, s * 0.78);
    b.lineTo(s * 0.82, s * 0.83);
    b.quadraticCurveTo(s * 0.5, s * 0.96, s * 0.18, s * 0.83);
    b.closePath();
    p.addPath(b);
  }

  private pathPawn(p: Path2D, s: number) {
    // tête
    p.moveTo(s * 0.5, s * 0.2);
    p.arc(s * 0.5, s * 0.32, s * 0.11, 0, 2 * Math.PI);
    // col + buste
    p.moveTo(s * 0.32, s * 0.78);
    p.quadraticCurveTo(s * 0.33, s * 0.52, s * 0.5, s * 0.48);
    p.quadraticCurveTo(s * 0.67, s * 0.52, s * 0.68, s * 0.78);
    p.closePath();
    this.pathBase(p, s);
  }

  private pathRook(p: Path2D, s: number) {
    // tour avec fût légèrement galbé
    p.moveTo(s * 0.3, s * 0.72);
    p.lineTo(s * 0.3, s * 0.36);
    // créneaux
    p.lineTo(s * 0.38, s * 0.28);
    p.lineTo(s * 0.45, s * 0.28);
    p.lineTo(s * 0.45, s * 0.22);
    p.lineTo(s * 0.55, s * 0.22);
    p.lineTo(s * 0.55, s * 0.28);
    p.lineTo(s * 0.62, s * 0.28);
    p.lineTo(s * 0.7, s * 0.36);
    p.lineTo(s * 0.7, s * 0.72);
    p.quadraticCurveTo(s * 0.5, s * 0.76, s * 0.3, s * 0.72);
    p.closePath();
    this.pathBase(p, s);
  }

  private pathKnight(p: Path2D, s: number) {
    // cheval stylisé, museau net
    p.moveTo(s * 0.28, s * 0.78);
    p.quadraticCurveTo(s * 0.32, s * 0.52, s * 0.45, s * 0.42);
    p.quadraticCurveTo(s * 0.6, s * 0.34, s * 0.62, s * 0.26);
    p.quadraticCurveTo(s * 0.55, s * 0.26, s * 0.5, s * 0.29);
    p.quadraticCurveTo(s * 0.46, s * 0.24, s * 0.52, s * 0.2);
    p.quadraticCurveTo(s * 0.72, s * 0.22, s * 0.7, s * 0.42);
    p.quadraticCurveTo(s * 0.68, s * 0.56, s * 0.75, s * 0.78);
    p.quadraticCurveTo(s * 0.52, s * 0.82, s * 0.28, s * 0.78);
    p.closePath();
    this.pathBase(p, s);
    // œil (petite découpe)
    // traité par le stroke/outline, pas de trou pour rester simple
  }

  private pathBishop(p: Path2D, s: number) {
    // silhouette en goutte + entaille
    p.moveTo(s * 0.5, s * 0.22);
    p.quadraticCurveTo(s * 0.66, s * 0.36, s * 0.64, s * 0.56);
    p.quadraticCurveTo(s * 0.62, s * 0.7, s * 0.72, s * 0.78);
    p.lineTo(s * 0.28, s * 0.78);
    p.quadraticCurveTo(s * 0.38, s * 0.7, s * 0.36, s * 0.56);
    p.quadraticCurveTo(s * 0.34, s * 0.36, s * 0.5, s * 0.22);
    p.closePath();
    this.pathBase(p, s);
    // entaille visuelle dessinée par highlight (voir draw)
  }

  private pathQueen(p: Path2D, s: number) {
    // couronne plus élégante
    p.moveTo(s * 0.26, s * 0.32);
    p.lineTo(s * 0.36, s * 0.18);
    p.lineTo(s * 0.48, s * 0.26);
    p.lineTo(s * 0.6, s * 0.18);
    p.lineTo(s * 0.7, s * 0.32);
    p.quadraticCurveTo(s * 0.86, s * 0.62, s * 0.7, s * 0.78);
    p.lineTo(s * 0.3, s * 0.78);
    p.quadraticCurveTo(s * 0.14, s * 0.62, s * 0.26, s * 0.32);
    p.closePath();
    this.pathBase(p, s);
  }

  private pathKing(p: Path2D, s: number) {
    // croix intégrée + tronc noble
    // corps
    p.moveTo(s * 0.3, s * 0.78);
    p.quadraticCurveTo(s * 0.22, s * 0.5, s * 0.42, s * 0.32);
    p.lineTo(s * 0.58, s * 0.32);
    p.quadraticCurveTo(s * 0.78, s * 0.5, s * 0.7, s * 0.78);
    p.closePath();
    // croix
    const cross = new Path2D();
    cross.rect(s * 0.47, s * 0.12, s * 0.06, s * 0.18);
    cross.rect(s * 0.4, s * 0.18, s * 0.2, s * 0.06);
    p.addPath(cross);
    this.pathBase(p, s);
  }

  // ====== utils ======
  private mix(a: string, b: string, t: number) {
    const pa = this.hexToRgb(a),
      pb = this.hexToRgb(b);
    const m = (x: number, y: number) => Math.round(x + (y - x) * t);
    return `rgb(${m(pa.r, pb.r)}, ${m(pa.g, pb.g)}, ${m(pa.b, pb.b)})`;
  }

  private hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const n =
      h.length === 3
        ? h
            .split('')
            .map((ch) => ch + ch)
            .join('')
        : h.padEnd(6, '0').slice(0, 6);
    const num = parseInt(n, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
}
