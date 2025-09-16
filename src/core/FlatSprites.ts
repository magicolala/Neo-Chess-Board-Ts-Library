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

    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.86, s * 0.36, s * 0.11, 0, 0, 2 * Math.PI);
    ctx.fill();

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

    (ctx as CanvasRenderingContext2D).fillStyle = grd(base);
    (ctx as CanvasRenderingContext2D).strokeStyle = stroke;
    (ctx as CanvasRenderingContext2D).lineWidth = Math.max(1, s * 0.03);
    (ctx as CanvasRenderingContext2D).lineJoin = 'round';
    (ctx as CanvasRenderingContext2D).lineCap = 'round';
    (ctx as CanvasRenderingContext2D).fill(path);
    (ctx as CanvasRenderingContext2D).stroke(path);

    ctx.save();
    (ctx as CanvasRenderingContext2D).globalCompositeOperation = 'lighter';
    (ctx as CanvasRenderingContext2D).fillStyle = highlight;
    const hl = new Path2D();
    hl.ellipse(s * 0.5, s * 0.28, s * 0.22, s * 0.08, 0.1, 0, Math.PI * 2);
    (ctx as CanvasRenderingContext2D).fill(hl);
    ctx.restore();

    ctx.restore();
  }

  // ====== PATHS (Style "Élégance Moderne") ======

  private pathBase(p: Path2D, s: number) {
    const b = new Path2D();
    b.moveTo(s * 0.15, s * 0.8);
    b.quadraticCurveTo(s * 0.5, s * 0.98, s * 0.85, s * 0.8);
    b.closePath();
    p.addPath(b);
  }

  private pathPawn(p: Path2D, s: number) {
    // Tête sphérique bien définie et col marqué
    p.arc(s * 0.5, s * 0.3, s * 0.18, 0, 2 * Math.PI);
    p.moveTo(s * 0.3, s * 0.8);
    p.quadraticCurveTo(s * 0.3, s * 0.6, s * 0.4, s * 0.45); // Épaule
    p.lineTo(s * 0.6, s * 0.45); // Col
    p.quadraticCurveTo(s * 0.7, s * 0.6, s * 0.7, s * 0.8); // Épaule opposée
    p.closePath();
    this.pathBase(p, s);
  }

  private pathRook(p: Path2D, s: number) {
    // Base large, sommet évasé pour une allure de forteresse
    p.moveTo(s * 0.25, s * 0.8);
    p.lineTo(s * 0.3, s * 0.35);
    // Créneaux plus marqués
    p.lineTo(s * 0.2, s * 0.35);
    p.lineTo(s * 0.2, s * 0.15);
    p.lineTo(s * 0.4, s * 0.15);
    p.lineTo(s * 0.4, s * 0.25);
    p.lineTo(s * 0.6, s * 0.25);
    p.lineTo(s * 0.6, s * 0.15);
    p.lineTo(s * 0.8, s * 0.15);
    p.lineTo(s * 0.8, s * 0.35);
    p.lineTo(s * 0.7, s * 0.35);
    p.lineTo(s * 0.75, s * 0.8);
    p.closePath();
    this.pathBase(p, s);
  }

  private pathKnight(p: Path2D, s: number) {
    // Silhouette équine plus détaillée et dynamique
    p.moveTo(s * 0.2, s * 0.8);
    p.lineTo(s * 0.3, s * 0.55);
    p.quadraticCurveTo(s * 0.25, s * 0.3, s * 0.4, s * 0.2); // Museau
    p.quadraticCurveTo(s * 0.6, s * 0.15, s * 0.65, s * 0.3); // Crinière
    p.lineTo(s * 0.75, s * 0.25); // Oreille
    p.lineTo(s * 0.7, s * 0.4);
    p.quadraticCurveTo(s * 0.8, s * 0.6, s * 0.75, s * 0.8); // Poitrail
    p.closePath();
    this.pathBase(p, s);
  }

  private pathBishop(p: Path2D, s: number) {
    // Corps élancé et fente de la mitre bien visible
    p.moveTo(s * 0.5, s * 0.15); // Pointe
    p.quadraticCurveTo(s * 0.8, s * 0.4, s * 0.7, s * 0.8); // Côté droit
    p.lineTo(s * 0.3, s * 0.8); // Base
    p.quadraticCurveTo(s * 0.2, s * 0.4, s * 0.5, s * 0.15); // Côté gauche
    p.closePath();
    // Fente (miter cut)
    const cut = new Path2D();
    cut.moveTo(s * 0.5, s * 0.15);
    cut.quadraticCurveTo(s * 0.4, s * 0.35, s * 0.5, s * 0.5);
    cut.quadraticCurveTo(s * 0.6, s * 0.35, s * 0.5, s * 0.15);
    p.addPath(cut);
    this.pathBase(p, s);
  }

  private pathQueen(p: Path2D, s: number) {
    // Silhouette cintrée et couronne à pointes acérées
    p.moveTo(s * 0.2, s * 0.8);
    p.quadraticCurveTo(s * 0.45, s * 0.4, s * 0.35, s * 0.35);
    // Couronne
    p.lineTo(s * 0.25, s * 0.2);
    p.lineTo(s * 0.4, s * 0.28);
    p.lineTo(s * 0.5, s * 0.1);
    p.lineTo(s * 0.6, s * 0.28);
    p.lineTo(s * 0.75, s * 0.2);
    p.lineTo(s * 0.65, s * 0.35);
    p.quadraticCurveTo(s * 0.55, s * 0.4, s * 0.8, s * 0.8);
    p.closePath();
    this.pathBase(p, s);
  }

  private pathKing(p: Path2D, s: number) {
    // Stature la plus haute, avec une croix pattée distincte
    p.moveTo(s * 0.25, s * 0.8);
    p.quadraticCurveTo(s * 0.45, s * 0.5, s * 0.4, s * 0.3); // Corps cintré
    p.lineTo(s * 0.6, s * 0.3);
    p.quadraticCurveTo(s * 0.55, s * 0.5, s * 0.75, s * 0.8);
    p.closePath();
    // Croix pattée (évasée)
    const cross = new Path2D();
    cross.moveTo(s * 0.45, s * 0.25);
    cross.lineTo(s * 0.4, s * 0.1); // Pointe haut-gauche
    cross.lineTo(s * 0.6, s * 0.1); // Pointe haut-droite
    cross.lineTo(s * 0.55, s * 0.25);
    cross.lineTo(s * 0.7, s * 0.2); // Pointe droite-haut
    cross.lineTo(s * 0.7, s * 0.15); // Pointe droite-bas
    cross.lineTo(s * 0.55, s * 0.2);
    cross.lineTo(s * 0.45, s * 0.2);
    cross.lineTo(s * 0.3, s * 0.15); // Pointe gauche-bas
    cross.lineTo(s * 0.3, s * 0.2); // Pointe gauche-haut
    cross.closePath();
    p.addPath(cross);
    this.pathBase(p, s);
  }

  // ====== UTILS ======
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
