import { ClockManager } from '../../clock/ClockManager';
import type { ClockConfig, ClockEvents, ClockState } from '../../clock/types';
import { EventBus } from '../EventBus';
import { ChessJsRules } from '../ChessJsRules';
import type {
  BoardEventMap,
  BoardPremoveSettings,
  Color,
  Move,
  Premove,
  RulesAdapter,
  RulesMoveResponse,
  Square,
} from '../types';
import {
  START_FEN,
  generateFileLabels,
  generateRankLabels,
  parseFEN,
  resolveBoardGeometry,
} from '../utils';
import type { ParsedFENState } from '../utils';

const DEFAULT_FILES = 8;
const DEFAULT_RANKS = 8;

export interface ChessGameOptions {
  fen?: string;
  rulesAdapter?: RulesAdapter;
  premove?: BoardPremoveSettings;
  allowPremoves?: boolean;
  clock?: ClockConfig;
  bus?: EventBus<BoardEventMap>;
  geometry?: {
    files?: number;
    ranks?: number;
    fileLabels?: readonly string[];
    rankLabels?: readonly string[];
  };
}

export class ChessGame {
  public readonly bus: EventBus<BoardEventMap>;
  private _rules: RulesAdapter;
  private _state: ParsedFENState;
  private _lastMove: { from: Square; to: Square } | null = null;
  private _premove: { from: Square; to: Square; promotion?: Move['promotion'] } | null = null;
  private _premoveQueues: Record<Color, Premove[]> = { w: [], b: [] };
  private _premoveSettings: { multi: boolean; colors: Record<Color, boolean> } = {
    multi: false,
    colors: { w: true, b: true },
  };
  private _allowPremoves = true;
  private _clockManager: ClockManager | null = null;
  private files: number;
  private ranks: number;
  private fileLabels: readonly string[];
  private rankLabels: readonly string[];

  constructor(options: ChessGameOptions = {}) {
    const geometry = resolveBoardGeometry({
      files: options.geometry?.files ?? DEFAULT_FILES,
      ranks: options.geometry?.ranks ?? DEFAULT_RANKS,
      fileLabels: options.geometry?.fileLabels,
      rankLabels: options.geometry?.rankLabels,
    });

    this.files = geometry.files;
    this.ranks = geometry.ranks;
    this.fileLabels = geometry.fileLabels ?? generateFileLabels(geometry.files);
    this.rankLabels = geometry.rankLabels ?? generateRankLabels(geometry.ranks);

    this.bus = options.bus ?? new EventBus<BoardEventMap>();
    this._rules = options.rulesAdapter ?? new ChessJsRules();

    const premoveSettings: BoardPremoveSettings = options.premove ?? {};
    this._applyInitialPremoveSettings(premoveSettings);
    if (typeof options.allowPremoves === 'boolean') {
      this._allowPremoves = options.allowPremoves;
    }

    const initialFen = options.fen ?? START_FEN;
    this._rules.setFEN(initialFen);
    this._state = this._parseFEN(this._rules.getFEN());

    this._initializeClock(options.clock);
  }

  public get rules(): RulesAdapter {
    return this._rules;
  }

  public set rules(adapter: RulesAdapter) {
    this._rules = adapter;
  }

  public get state(): ParsedFENState {
    return this._state;
  }

  public set state(next: ParsedFENState) {
    this._state = next;
  }

  public get lastMove(): { from: Square; to: Square } | null {
    return this._lastMove;
  }

  public set lastMove(move: { from: Square; to: Square } | null) {
    this._lastMove = move;
  }

  public get premove(): { from: Square; to: Square; promotion?: Move['promotion'] } | null {
    return this._premove;
  }

  public set premove(premove: { from: Square; to: Square; promotion?: Move['promotion'] } | null) {
    this._premove = premove;
  }

  public get premoveQueues(): Record<Color, Premove[]> {
    return this._premoveQueues;
  }

  public set premoveQueues(queues: Record<Color, Premove[]>) {
    this._premoveQueues = queues;
  }

  public get premoveSettings(): { multi: boolean; colors: Record<Color, boolean> } {
    return this._premoveSettings;
  }

  public set premoveSettings(settings: { multi: boolean; colors: Record<Color, boolean> }) {
    this._premoveSettings = settings;
  }

  public get allowPremoves(): boolean {
    return this._allowPremoves;
  }

  public set allowPremoves(value: boolean) {
    this._allowPremoves = value;
  }

  public get clockManager(): ClockManager | null {
    return this._clockManager;
  }

  public set clockManager(manager: ClockManager | null) {
    this._clockManager = manager;
  }

  public getClockState(): ClockState | null {
    return this._clockManager ? this._clockManager.getState() : null;
  }

  public getFEN(): string {
    return this._rules.getFEN();
  }

  public setFEN(fen: string): ParsedFENState {
    this._rules.setFEN(fen);
    const oldTurn = this._state.turn;
    this._state = this._parseFEN(this._rules.getFEN());
    this._lastMove = null;
    this._premove = null;
    this._syncClockFromTurn(oldTurn);
    this.bus.emit('update', { fen: this._rules.getFEN() });
    return this._state;
  }

  public undo(): ParsedFENState {
    const undone = this._rules.undo();
    if (!undone) {
      return this._state;
    }
    const oldTurn = this._state.turn;
    this._state = this._parseFEN(this._rules.getFEN());
    this._lastMove = null;
    this._syncClockFromTurn(oldTurn);
    this.bus.emit('update', { fen: this._rules.getFEN() });
    return this._state;
  }

  public move(
    move: { from: Square; to: Square; promotion?: Move['promotion'] } | string,
  ): RulesMoveResponse {
    const moveResult = this._rules.move(
      move as { from: Square; to: Square; promotion?: Move['promotion'] },
    );
    if (moveResult?.ok) {
      const oldTurn = this._state.turn;
      this._state = this._parseFEN(moveResult.fen ?? this._rules.getFEN());
      this._lastMove = {
        from: (move as { from: Square; to: Square }).from,
        to: (move as { from: Square; to: Square }).to,
      };
      this._syncClockFromTurn(oldTurn);
      this.bus.emit('move', {
        from: this._lastMove.from,
        to: this._lastMove.to,
        fen: this._rules.getFEN(),
        san: moveResult.move?.san,
      });
      this.bus.emit('update', { fen: this._rules.getFEN() });
    } else {
      const normalizedMove = move as { from: Square; to: Square };
      this.bus.emit('illegal', {
        from: normalizedMove?.from,
        to: normalizedMove?.to,
        reason: moveResult?.reason ?? 'Invalid move',
      });
    }
    return moveResult ?? { ok: false, reason: 'Invalid move' };
  }

  public isDraw(): boolean {
    return this._rules.isDraw();
  }

  public isInsufficientMaterial(): boolean {
    return this._rules.isInsufficientMaterial();
  }

  public isThreefoldRepetition(): boolean {
    return this._rules.isThreefoldRepetition();
  }

  public getHistory(): string[] {
    return typeof this._rules.history === 'function' ? this._rules.history() : [];
  }

  public toPgn(includeHeaders?: boolean): string {
    if (typeof this._rules.toPgn === 'function') {
      return this._rules.toPgn(includeHeaders);
    }
    if (typeof this._rules.getPGN === 'function') {
      return this._rules.getPGN();
    }
    return '';
  }

  public loadPgn(pgn: string): boolean {
    if (typeof this._rules.loadPgn !== 'function') {
      return false;
    }
    const ok = this._rules.loadPgn(pgn);
    if (ok) {
      this._state = this._parseFEN(this._rules.getFEN());
      this.bus.emit('update', { fen: this._rules.getFEN() });
    }
    return ok;
  }

  public configurePremove(options?: BoardPremoveSettings): void {
    if (!options) {
      return;
    }
    this._applyInitialPremoveSettings(options);
    if (typeof options.enabled === 'boolean') {
      this._allowPremoves = options.enabled;
    }
  }

  public setPremove(premove: Premove, color: Color): void {
    if (!this._allowPremoves || !this._premoveSettings.colors[color]) return;
    const entry: Premove = premove.promotion
      ? { from: premove.from, to: premove.to, promotion: premove.promotion }
      : { from: premove.from, to: premove.to };
    this._premoveQueues[color] = this._premoveSettings.multi
      ? [...this._premoveQueues[color], entry]
      : [entry];
    this._premove = { ...entry };
  }

  public clearPremoves(): void {
    this._premoveQueues.w = [];
    this._premoveQueues.b = [];
    this._premove = null;
  }

  public executeQueuedPremove(): void {
    const activeColor = this._state.turn as Color;
    const queue = this._premoveQueues[activeColor];
    if (!queue || queue.length === 0) return;

    const premove = queue[0];
    const premoveResult = this._rules.move({
      from: premove.from,
      to: premove.to,
      promotion: premove.promotion,
    });

    if (premoveResult?.ok) {
      this._state = this._parseFEN(this._rules.getFEN());
      this._lastMove = { from: premove.from, to: premove.to };
      this._premoveQueues[activeColor] = queue.slice(1);
      this.bus.emit('premoveApplied', {
        from: premove.from,
        to: premove.to,
        fen: this._rules.getFEN(),
        color: activeColor === 'w' ? 'white' : 'black',
        promotion: premove.promotion,
        remaining: this._premoveQueues[activeColor].length,
      });
      this.bus.emit('update', { fen: this._rules.getFEN() });
    } else {
      this.bus.emit('premoveInvalidated', {
        color: activeColor === 'w' ? 'white' : 'black',
        premove,
        reason: premoveResult?.reason,
      });
      this._premoveQueues[activeColor] = queue.slice(1);
      this._premove = null;
    }
  }

  private _applyInitialPremoveSettings(settings: BoardPremoveSettings): void {
    if (typeof settings.multi === 'boolean') {
      this._premoveSettings.multi = settings.multi;
    }

    const colors = settings.colors ?? settings.color;
    if (colors === 'white') {
      this._premoveSettings.colors = { w: true, b: false };
    } else if (colors === 'black') {
      this._premoveSettings.colors = { w: false, b: true };
    } else if (typeof colors === 'object' && colors !== null) {
      this._premoveSettings.colors = {
        w: colors.white !== false,
        b: colors.black !== false,
      };
    } else {
      this._premoveSettings.colors = { w: true, b: true };
    }
  }

  private _initializeClock(clockConfig: ClockConfig | undefined): void {
    if (!clockConfig) {
      this._clockManager = null;
      return;
    }

    const resolvedConfig: ClockConfig = {
      ...clockConfig,
      active: clockConfig.active ?? this._state?.turn ?? 'w',
    };

    const bus = this.bus;
    this._clockManager = new ClockManager(resolvedConfig, bus as unknown as EventBus<ClockEvents>);
  }

  private _syncClockFromTurn(previousTurn: Color): void {
    const manager = this._clockManager;
    if (!manager) {
      return;
    }

    const currentTurn = this._state.turn;
    if (previousTurn === currentTurn) {
      return;
    }

    const state = manager.getState();
    if (!state || state.active === null) {
      return;
    }

    if (state.active === currentTurn) {
      return;
    }

    manager.switchActive();
  }

  private _parseFEN(fen: string): ParsedFENState {
    return parseFEN(fen, {
      files: this.files,
      ranks: this.ranks,
    });
  }
}
