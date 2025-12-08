import type { DrawingManager } from '../DrawingManager';
import type {
  BoardPremoveSettings,
  Color,
  Move,
  Premove,
  PremoveColorListInput,
  PremoveColorOption,
  Square,
} from '../types';

export class PremoveManager {
  private premove: { from: Square; to: Square; promotion?: Move['promotion'] } | null = null;
  private queues: Record<Color, Premove[]> = { w: [], b: [] };
  private settings: { multi: boolean; colors: Record<Color, boolean> } = {
    multi: false,
    colors: { w: true, b: true },
  };
  private allowPremoves: boolean;
  private drawingManager?: DrawingManager;

  constructor(
    settings: BoardPremoveSettings,
    allowPremoves: boolean,
    private readonly getDefaultColor: () => Color,
    private readonly requestRender?: () => void,
    drawingManager?: DrawingManager,
  ) {
    this.allowPremoves = allowPremoves;
    this.applyInitialSettings(settings);
    this.drawingManager = drawingManager;
  }

  public setDrawingManager(manager?: DrawingManager): void {
    this.drawingManager = manager;
  }

  public isEnabled(): boolean {
    return this.allowPremoves;
  }

  public setEnabled(allow: boolean): void {
    this.allowPremoves = allow;
    if (!allow) {
      this.queues = { w: [], b: [] };
      this.premove = null;
    }
  }

  public getSettings(): { multi: boolean; colors: Record<Color, boolean> } {
    return this.settings;
  }

  public setSettings(settings: { multi: boolean; colors: Record<Color, boolean> }): void {
    this.settings = settings;
  }

  public getQueues(): Record<Color, Premove[]> {
    return this.queues;
  }

  public setQueues(queues: Record<Color, Premove[]>): void {
    this.queues = queues;
  }

  public getActive(): { from: Square; to: Square; promotion?: Move['promotion'] } | null {
    return this.premove ? { ...this.premove } : null;
  }

  public setActive(
    premove: { from: Square; to: Square; promotion?: Move['promotion'] } | null,
  ): void {
    this.premove = premove ? { ...premove } : null;
  }

  public queue(color: Color, premove: Premove, render = false): void {
    if (!this.settings.colors[color]) {
      return;
    }

    const entry: Premove = premove.promotion
      ? { from: premove.from, to: premove.to, promotion: premove.promotion }
      : { from: premove.from, to: premove.to };

    this.queues[color] = this.settings.multi ? [...this.queues[color], entry] : [entry];
    this.syncDisplay(color, render);
  }

  public clear(color?: PremoveColorOption): void {
    const colors = color ? this.resolveColorsForClearing(color) : (['w', 'b'] as Color[]);
    let updated = false;
    for (const code of colors) {
      if (this.queues[code].length > 0) {
        this.queues[code] = [];
        updated = true;
      }
    }
    if (updated) {
      this.syncDisplay(undefined, true);
    }
  }

  public getActiveOrNull(): Premove | null {
    return this.premove ? { ...this.premove } : null;
  }

  public getQueue(color: Color): Premove[] {
    return this.queues[color].map((entry) => ({ ...entry }));
  }

  public executeNext(color: Color, executor: (p: Premove) => boolean): boolean {
    const queue = this.queues[color];
    if (queue.length === 0 || !this.settings.colors[color]) {
      return false;
    }

    const premove = queue[0];
    const success = executor(premove);
    if (success) {
      queue.shift();
      this.syncDisplay(color, true);
    }

    return success;
  }

  public invalidate(color: Color, premove: Premove, reason?: string): void {
    this.removeMatchingPremove(color, premove);
    this.syncDisplay(color, true);
    if (reason) {
      console.warn(`Premove invalidated: ${reason}`);
    }
  }

  public syncDisplay(preferredColor?: Color, render = false): void {
    if (!this.allowPremoves) {
      if (this.drawingManager) {
        this.drawingManager.setPremoveQueues(undefined, undefined);
      }
      this.premove = null;
      if (render) {
        this.requestRender?.();
      }
      return;
    }

    const active = this.determineActivePremove(preferredColor);
    if (this.drawingManager) {
      this.drawingManager.setPremoveQueues(this.buildPremoveQueueState(), active ?? undefined);
    }
    this.premove = active ? { ...active.premove } : null;

    if (render) {
      this.requestRender?.();
    }
  }

  private applyInitialSettings(settings: BoardPremoveSettings): void {
    if (typeof settings.multi === 'boolean') {
      this.settings.multi = settings.multi;
    }
    if (settings.color) {
      this.setColorsFromOption(settings.color);
    }
    if (settings.colors) {
      this.setPremoveColors(settings.colors);
    }
  }

  private setColorsFromOption(option: PremoveColorOption): void {
    if (option === 'white') {
      this.settings.colors = { w: true, b: false };
      this.queues.b = [];
    } else if (option === 'black') {
      this.settings.colors = { w: false, b: true };
      this.queues.w = [];
    } else {
      this.settings.colors = { w: true, b: true };
    }
  }

  private setPremoveColors(colors: Partial<Record<'white' | 'black', boolean>>): void {
    if (typeof colors.white === 'boolean') {
      this.settings.colors.w = colors.white;
      if (!colors.white) {
        this.queues.w = [];
      }
    }
    if (typeof colors.black === 'boolean') {
      this.settings.colors.b = colors.black;
      if (!colors.black) {
        this.queues.b = [];
      }
    }
  }

  private buildPremoveQueueState(): Partial<Record<Color, Premove[]>> | undefined {
    const queues: Partial<Record<Color, Premove[]>> = {};
    for (const color of ['w', 'b'] as const) {
      if (!this.settings.colors[color]) continue;
      if (this.queues[color].length > 0) {
        queues[color] = this.queues[color].map((entry) => ({ ...entry }));
      }
    }
    return Object.keys(queues).length > 0 ? queues : undefined;
  }

  private determineActivePremove(
    preferredColor?: Color,
  ): { color: Color; premove: Premove } | null {
    const order: Color[] = [];
    const seen = new Set<Color>();
    const push = (color: Color): void => {
      if (seen.has(color)) return;
      seen.add(color);
      order.push(color);
    };

    if (preferredColor) {
      push(preferredColor);
    }
    const defaultColor = this.getDefaultColor();
    push(defaultColor);
    push(defaultColor === 'w' ? 'b' : 'w');

    for (const color of order) {
      if (!this.settings.colors[color]) continue;
      const queue = this.queues[color];
      if (queue.length > 0) {
        return { color, premove: { ...queue[0] } };
      }
    }

    return null;
  }

  private removeMatchingPremove(color: Color, premove: Premove): void {
    const queue = this.queues[color];
    if (queue.length === 0) return;

    if (this.arePremovesEqual(queue[0], premove)) {
      queue.shift();
      return;
    }

    const index = queue.findIndex((entry) => this.arePremovesEqual(entry, premove));
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }

  private arePremovesEqual(a: Premove, b: Premove): boolean {
    return a.from === b.from && a.to === b.to && (a.promotion ?? null) === (b.promotion ?? null);
  }

  private resolveColorsForClearing(color?: PremoveColorOption): Color[] {
    const normalized = this.normalizeColorSelection(color);
    return normalized.length > 0 ? normalized : (['w', 'b'] as Color[]);
  }

  private normalizeColorSelection(input?: PremoveColorListInput): Color[] {
    if (input === undefined) {
      return [];
    }

    const values = Array.isArray(input) ? input : [input];
    const result: Color[] = [];

    for (const value of values) {
      this.appendColorsFromInput(value, result);
    }

    return result;
  }

  private appendColorsFromInput(value: PremoveColorListInput, result: Color[]): void {
    if (value === 'both') {
      this.addColorIfMissing(result, 'w');
      this.addColorIfMissing(result, 'b');
      return;
    }

    const normalized = this.normalizeSingleColor(value);
    if (normalized) {
      this.addColorIfMissing(result, normalized);
    }
  }

  private normalizeSingleColor(value: PremoveColorListInput): Color | null {
    if (value === 'white') return 'w';
    if (value === 'black') return 'b';
    if (value === 'w' || value === 'b') return value;
    return null;
  }

  private addColorIfMissing(list: Color[], color: Color): void {
    if (!list.includes(color)) {
      list.push(color);
    }
  }
}
