import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import type {
  Arrow,
  BoardEventMap,
  Color,
  PgnMove,
  PgnMoveAnnotations,
  RulesAdapter,
  Square,
  SquareHighlight,
  Theme,
} from '../../src/core/types';
import { START_FEN } from '../../src/core/utils';
import type { PgnNotation } from '../../src/core/PgnNotation';
import type { BoardAudioManager } from '../../src/core/BoardAudioManager';
import type { EventBus } from '../../src/core/EventBus';

type MinimalPgnNotation = Pick<
  PgnNotation,
  | 'loadPgnWithAnnotations'
  | 'getMovesWithAnnotations'
  | 'addMoveAnnotations'
  | 'toPgnWithAnnotations'
>;

const getPrivate = <T>(instance: unknown, key: string): T =>
  Reflect.get(instance as Record<string, unknown>, key) as T;

const getMethodHost = (instance: NeoChessBoard): Record<string, (...args: unknown[]) => unknown> =>
  instance as unknown as Record<string, (...args: unknown[]) => unknown>;

if (globalThis.PointerEvent === undefined) {
  class PointerEventPolyfill extends MouseEvent {
    constructor(type: string, init?: Record<string, unknown>) {
      super(type, init);
    }
  }
  (globalThis as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
    PointerEventPolyfill as unknown as typeof PointerEvent;
}

class StubPgnNotation implements MinimalPgnNotation {
  private moves: PgnMove[] = [];
  public lastLoaded: string | null = null;
  public storedAnnotations: Array<{
    moveNumber: number;
    isWhite: boolean;
    annotations: PgnMoveAnnotations;
  }> = [];
  public exportValue = '[Event "Stub"]\n\n1. e4 e5';

  loadPgnWithAnnotations(pgn: string): void {
    this.lastLoaded = pgn;
  }

  getMovesWithAnnotations(): PgnMove[] {
    return this.moves;
  }

  setAnnotatedMoves(moves: PgnMove[]): void {
    this.moves = moves;
  }

  addMoveAnnotations(moveNumber: number, isWhite: boolean, annotations: PgnMoveAnnotations): void {
    this.storedAnnotations.push({ moveNumber, isWhite, annotations });
  }

  toPgnWithAnnotations(): string {
    return this.exportValue;
  }
}

class PgnFriendlyRules implements RulesAdapter {
  private fen: string = START_FEN;
  private turnColor: Color = 'w';
  private readonly notation = new StubPgnNotation();
  private historyMoves: string[] = ['e2e4', 'e7e5'];
  private lastLoaded = '[Event "Stub"]\n\n1. e4 e5 {Great move!}';

  setFEN(fen: string): void {
    this.fen = fen;
    const parts = fen.split(' ');
    this.turnColor = (parts[1] as Color | undefined) ?? 'w';
  }

  getFEN(): string {
    return this.fen;
  }

  turn(): Color {
    return this.turnColor;
  }

  movesFrom(_square: Square) {
    return [];
  }

  move(_move: unknown) {
    return { ok: true as const, fen: this.fen };
  }

  undo(): boolean {
    return false;
  }

  isCheckmate(): boolean {
    return false;
  }

  inCheck(): boolean {
    return false;
  }

  isStalemate(): boolean {
    return false;
  }

  isDraw(): boolean {
    return false;
  }

  isInsufficientMaterial(): boolean {
    return false;
  }

  isThreefoldRepetition(): boolean {
    return false;
  }

  loadPgn(pgn: string): boolean {
    this.lastLoaded = pgn;
    this.notation.loadPgnWithAnnotations(pgn);
    return true;
  }

  getPGN(): string {
    return this.lastLoaded;
  }

  getPgnNotation(): PgnNotation {
    return this.notation as unknown as PgnNotation;
  }

  history(): string[] {
    return [...this.historyMoves];
  }

  public getNotation(): StubPgnNotation {
    return this.notation;
  }

  public setHistory(moves: string[]): void {
    this.historyMoves = moves;
  }
}

describe('NeoChessBoard PGN and notation helpers', () => {
  let container: HTMLDivElement;
  let board: NeoChessBoard;
  let rules: PgnFriendlyRules;
  let drawingManagerMock: Record<string, jest.Mock> & {
    addArrowFromObject: jest.Mock;
    addHighlightFromObject: jest.Mock;
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    rules = new PgnFriendlyRules();
    board = new NeoChessBoard(container, { rulesAdapter: rules });

    drawingManagerMock = {
      addArrow: jest.fn(),
      addArrowFromObject: jest.fn(),
      removeArrow: jest.fn(),
      clearArrows: jest.fn(),
      setArrowOptions: jest.fn(),
      setAllowDrawingArrows: jest.fn(),
      setClearArrowsOnClick: jest.fn(),
      setArrows: jest.fn(),
      addHighlight: jest.fn(),
      addHighlightFromObject: jest.fn(),
      removeHighlight: jest.fn(),
      clearHighlights: jest.fn(),
      clearAll: jest.fn(),
      exportState: jest.fn().mockReturnValue('state'),
      importState: jest.fn(),
      renderStatusHighlight: jest.fn(),
      renderArrows: jest.fn(),
      renderHighlights: jest.fn(),
      renderPremove: jest.fn(),
      renderPromotionPreview: jest.fn(),
      renderSquareNames: jest.fn(),
      setPremoveQueues: jest.fn(),
      getPremoveQueues: jest.fn().mockReturnValue({ w: [], b: [] }),
      getActivePremoveColor: jest.fn().mockReturnValue(null),
      setPromotionPreview: jest.fn(),
      clearPromotionPreview: jest.fn(),
      cancelCurrentAction: jest.fn(),
      setNotationStyles: jest.fn(),
      updateDimensions: jest.fn(),
      setOrientation: jest.fn(),
      setShowSquareNames: jest.fn(),
      handleMouseUp: jest.fn().mockReturnValue(false),
      handleLeftClick: jest.fn().mockReturnValue(false),
      handleRightMouseDown: jest.fn().mockReturnValue(false),
      handleRightMouseUp: jest.fn().mockReturnValue(false),
      handleHighlightClick: jest.fn(),
      clearAllDrawings: jest.fn(),
    };

    Reflect.set(board as unknown as Record<string, unknown>, 'drawingManager', drawingManagerMock);
    jest.spyOn(board, 'renderAll').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    board.destroy();
    container.remove();
  });

  it('exports PGN using getPGN fallback and strips comments', () => {
    const result = board.exportPGN({ includeHeaders: false, includeComments: false });
    expect(result).toBe('1. e4 e5');
  });

  it('warns when PGN export is unsupported', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Reflect.set(board as unknown as Record<string, unknown>, 'rules', {
      ...rules,
      getPGN: undefined,
      toPgn: undefined,
    });

    expect(board.exportPGN()).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      '[NeoChessBoard] The current rules adapter does not support PGN export.',
    );
  });

  it('loads PGN annotations and updates board state', () => {
    const notation = rules.getNotation();
    const arrow: Arrow = { from: 'e2', to: 'e4', color: '#ff0' };
    const circle: SquareHighlight = { square: 'e4', type: 'circle', color: '#0ff' };
    notation.setAnnotatedMoves([
      {
        moveNumber: 1,
        white: 'e4',
        black: 'e5',
        blackAnnotations: { arrows: [arrow], circles: [circle] },
      },
    ]);

    const success = board.loadPgnWithAnnotations('[Event "Test"]\n\n1. e4 e5');

    expect(success).toBe(true);
    expect(drawingManagerMock.clearArrows).toHaveBeenCalled();
    expect(drawingManagerMock.clearHighlights).toHaveBeenCalled();
    expect(drawingManagerMock.addArrowFromObject).toHaveBeenCalledWith(arrow);
    expect(drawingManagerMock.addHighlightFromObject).toHaveBeenCalledWith(circle);
    expect(board.getPosition()).toBe(rules.getFEN());
  });

  it('returns false when loading PGN annotations throws', () => {
    const errorRules: RulesAdapter = {
      ...rules,
      loadPgn: () => {
        throw new Error('boom');
      },
      setFEN: rules.setFEN.bind(rules),
      getFEN: rules.getFEN.bind(rules),
      turn: rules.turn.bind(rules),
      movesFrom: rules.movesFrom.bind(rules),
      move: rules.move.bind(rules),
      undo: rules.undo.bind(rules),
      isCheckmate: rules.isCheckmate.bind(rules),
      inCheck: rules.inCheck.bind(rules),
      isStalemate: rules.isStalemate.bind(rules),
      isDraw: rules.isDraw.bind(rules),
      isInsufficientMaterial: rules.isInsufficientMaterial.bind(rules),
      isThreefoldRepetition: rules.isThreefoldRepetition.bind(rules),
      getPGN: rules.getPGN.bind(rules),
      getPgnNotation: rules.getPgnNotation.bind(rules),
      history: rules.history.bind(rules),
    };
    Reflect.set(board as unknown as Record<string, unknown>, 'rules', errorRules);

    expect(board.loadPgnWithAnnotations('1. e4 e5')).toBe(false);
  });

  it('exports PGN with annotations when available', () => {
    const notation = rules.getNotation();
    notation.exportValue = 'annotated';
    expect(board.exportPgnWithAnnotations()).toBe('annotated');
  });

  it('saves annotations for the current move and forwards them to the drawing manager', () => {
    const notation = rules.getNotation();
    rules.setHistory(['e2e4']);

    board.addAnnotationsToCurrentMove(
      [{ from: 'e2', to: 'e4', color: '#f00' }],
      [{ square: 'e4', type: 'circle', color: '#0f0' }],
      'Nice move',
    );

    expect(notation.storedAnnotations).toEqual([
      {
        moveNumber: 1,
        isWhite: false,
        annotations: {
          arrows: [{ from: 'e2', to: 'e4', color: '#f00' }],
          circles: [{ square: 'e4', type: 'circle', color: '#0f0' }],
          textComment: 'Nice move',
        },
      },
    ]);
    expect(drawingManagerMock.addArrowFromObject).toHaveBeenCalled();
    expect(drawingManagerMock.addHighlightFromObject).toHaveBeenCalled();
  });

  it('converts between move notation formats', () => {
    expect(board.convertMoveNotation('  ', 'san', 'uci')).toBeNull();
    expect(board.convertMoveNotation('e4', 'san', 'san')).toBe('e4');
    expect(board.sanToUci('e4')).toBe('e2e4');
    expect(board.uciToSan('e2e4')).toBe('e4');
    expect(board.coordinatesToUci('e2-e4')).toBe('e2e4');
    expect(board.coordinatesToSan('e2-e4')).toBe('e4');
    expect(board.convertMoveNotation('invalid', 'coord', 'san')).toBeNull();
  });
});

describe('NeoChessBoard configuration side-effects', () => {
  let container: HTMLDivElement;
  let board: NeoChessBoard;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    board = new NeoChessBoard(container);
    jest.spyOn(board, 'renderAll').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    board.destroy();
    container.remove();
  });

  it('merges partial theme overrides when setting theme', () => {
    const applySpy = jest.spyOn(board, 'applyTheme');
    board.setTheme({ moveHighlight: '#123', moveTo: '#456', check: '#789', stalemate: '#abc' });

    expect(applySpy).toHaveBeenCalledTimes(1);
    const appliedTheme = applySpy.mock.calls[0][0] as Theme;
    expect(appliedTheme.moveHighlight).toBe('#123');
    expect(appliedTheme.moveTo).toBe('#456');
    expect(appliedTheme.check).toBe('#789');
    expect(appliedTheme.stalemate).toBe('#abc');
  });

  it('updates notation styles and triggers drawing manager updates', () => {
    const drawingManager = getPrivate<ReturnType<typeof getMethodHost>>(board, 'drawingManager');
    const notationSpy = jest.spyOn(drawingManager, 'setNotationStyles');

    board.setLightSquareNotationStyle({ color: '#fff' });
    board.setDarkSquareNotationStyle({ color: '#000' });
    board.setAlphaNotationStyle({ fontWeight: 'bold' });
    board.setNumericNotationStyle({ fontStyle: 'italic' });

    expect(notationSpy).toHaveBeenCalledTimes(4);
  });

  it('updates sound configuration through the audio manager', () => {
    const audioManager = getPrivate<BoardAudioManager>(board, 'audioManager');
    jest.spyOn(audioManager, 'setEnabled');
    jest.spyOn(audioManager, 'setSoundUrls');
    jest.spyOn(audioManager, 'setSoundEventUrls');

    board.setSoundEnabled(false);
    board.setSoundUrls({ white: 'white.mp3' });
    board.setSoundEventUrls({ capture: 'capture.mp3' });

    expect(audioManager.setEnabled).toHaveBeenCalledWith(false);
    expect(audioManager.setSoundUrls).toHaveBeenCalledWith({ white: 'white.mp3' });
    expect(audioManager.setSoundEventUrls).toHaveBeenCalledWith({ capture: 'capture.mp3' });
  });

  it('clears premove queues when disabling premoves', () => {
    const methodHost = getMethodHost(board);
    methodHost._queuePremove('w', { from: 'a2', to: 'a3' }, false);
    methodHost._queuePremove('b', { from: 'a7', to: 'a6' }, false);
    board.setAllowPremoves(false);

    const queues = getPrivate<Record<Color, unknown[]>>(board, '_premoveQueues');
    expect(queues.w).toHaveLength(0);
    expect(queues.b).toHaveLength(0);
  });

  it('manages clock state notifications', () => {
    const bus = getPrivate<EventBus<BoardEventMap>>(board, 'bus');
    jest.spyOn(bus, 'emit');
    const changeSpy = jest.fn();
    const startSpy = jest.fn();
    const pauseSpy = jest.fn();
    const flagSpy = jest.fn();

    board.setClockConfig({
      initial: 1000,
      increment: { w: 500, b: 0 },
      active: 'w',
      callbacks: {
        onClockChange: changeSpy,
        onClockStart: startSpy,
        onClockPause: pauseSpy,
        onFlag: flagSpy,
      },
    });

    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(startSpy).toHaveBeenCalledTimes(1);

    const updated = board.updateClockState({ white: { remaining: 0 } });
    expect(updated?.white.remaining).toBe(0);
    expect(flagSpy).toHaveBeenCalledWith({
      color: 'w',
      state: expect.objectContaining({ white: expect.objectContaining({ isFlagged: true }) }),
    });

    board.updateClockState({ active: null, running: false });
    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  it('updates orientation when auto flip is enabled', () => {
    board.setAutoFlip(true);
    board.setFEN('7k/8/8/8/8/8/8/7K b - - 0 1', true);
    expect(board.getOrientation()).toBe('black');
  });
});
