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

  // Utilitaire pour dessiner des rectangles arrondis (conservé de votre code original)
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

  private build(px: number): HTMLCanvasElement | OffscreenCanvas {
    const c =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(px * 6, px * 2)
        : Object.assign(document.createElement('canvas'), { width: px * 6, height: px * 2 });

    const ctx = c.getContext('2d')!;
    if (!ctx) throw new Error('Could not get 2D context');

    const order = ['k', 'q', 'r', 'b', 'n', 'p'] as const;
    order.forEach((t, i) => {
      this.draw(ctx, i * px, 0, px, t, 'black');
      this.draw(ctx, i * px, px, px, t, 'white');
    });
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
    const pieceColor = color === 'white' ? this.colors.whitePiece : this.colors.blackPiece;
    const shadowColor = this.colors.pieceShadow;

    ctx.save();
    ctx.translate(x, y);

    // Ombre
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.82, s * 0.35, s * 0.1, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = pieceColor;

    // Appel de la fonction de dessin spécifique à la pièce
    switch (type) {
      case 'p':
        this.drawPawn(ctx, s);
        break;
      case 'r':
        this.drawRook(ctx, s);
        break;
      case 'n':
        this.drawKnight(ctx, s);
        break;
      case 'b':
        this.drawBishop(ctx, s);
        break;
      case 'q':
        this.drawQueen(ctx, s);
        break;
      case 'k':
        this.drawKing(ctx, s);
        break;
    }

    ctx.restore();
  }

  // --- NOUVELLES MÉTHODES DE DESSIN ---

  private drawBase(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, s: number) {
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.8);
    ctx.quadraticCurveTo(s * 0.5, s * 0.95, s * 0.8, s * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  private drawPawn(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, s: number) {
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.35, s * 0.15, 0, 2 * Math.PI);
    ctx.moveTo(s * 0.3, s * 0.8);
    ctx.quadraticCurveTo(s * 0.3, s * 0.5, s * 0.5, s * 0.45);
    ctx.quadraticCurveTo(s * 0.7, s * 0.5, s * 0.7, s * 0.8);
    ctx.closePath();
    ctx.fill();
    this.drawBase(ctx, s);
  }

  private drawRook(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, s: number) {
    ctx.beginPath();
    ctx.rect(s * 0.25, s * 0.2, s * 0.5, s * 0.6);
    // Créneaux
    ctx.rect(s * 0.25, s * 0.15, s * 0.1, s * 0.1);
    ctx.rect(s * 0.45, s * 0.15, s * 0.1, s * 0.1);
    ctx.rect(s * 0.65, s * 0.15, s * 0.1, s * 0.1);
    ctx.fill();
    this.drawBase(ctx, s);
  }

  private drawKnight(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, s: number) {
    ctx.beginPath();
    ctx.moveTo(s * 0.25, s * 0.8);
    ctx.lineTo(s * 0.3, s * 0.6);
    ctx.quadraticCurveTo(s * 0.2, s * 0.4, s * 0.4, s * 0.2);
    ctx.quadraticCurveTo(s * 0.6, s * 0.3, s * 0.65, s * 0.5);
    ctx.lineTo(s * 0.75, s * 0.8);
    ctx.closePath();
    ctx.fill();
    this.drawBase(ctx, s);
  }

  private drawBishop(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, s: number) {
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.45, s * 0.2, 0, 2 * Math.PI);
    ctx.moveTo(s * 0.3, s * 0.8);
    ctx.quadraticCurveTo(s * 0.4, s * 0.5, s * 0.5, s * 0.2);
    ctx.quadraticCurveTo(s * 0.6, s * 0.5, s * 0.7, s * 0.8);
    ctx.closePath();
    ctx.fill();

    // Entaille
    const prevOp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(s * 0.55, s * 0.2);
    ctx.quadraticCurveTo(s * 0.5, s * 0.3, s * 0.45, s * 0.2);
    ctx.lineWidth = s * 0.08;
    ctx.stroke();
    ctx.globalCompositeOperation = prevOp;

    this.drawBase(ctx, s);
  }

  private drawQueen(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, s: number) {
    ctx.beginPath();
    // Couronne
    ctx.moveTo(s * 0.25, s * 0.3);
    ctx.lineTo(s * 0.35, s * 0.15);
    ctx.lineTo(s * 0.5, s * 0.25);
    ctx.lineTo(s * 0.65, s * 0.15);
    ctx.lineTo(s * 0.75, s * 0.3);
    // Corps
    ctx.quadraticCurveTo(s * 0.9, s * 0.6, s * 0.7, s * 0.8);
    ctx.lineTo(s * 0.3, s * 0.8);
    ctx.quadraticCurveTo(s * 0.1, s * 0.6, s * 0.25, s * 0.3);
    ctx.closePath();
    ctx.fill();
    this.drawBase(ctx, s);
  }

  private drawKing(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, s: number) {
    ctx.beginPath();
    // Croix
    ctx.rect(s * 0.45, s * 0.05, s * 0.1, s * 0.25);
    ctx.rect(s * 0.375, s * 0.12, s * 0.25, s * 0.1);
    // Corps
    ctx.moveTo(s * 0.3, s * 0.8);
    ctx.quadraticCurveTo(s * 0.2, s * 0.5, s * 0.4, s * 0.3);
    ctx.lineTo(s * 0.6, s * 0.3);
    ctx.quadraticCurveTo(s * 0.8, s * 0.5, s * 0.7, s * 0.8);
    ctx.closePath();
    ctx.fill();
    this.drawBase(ctx, s);
  }
}
