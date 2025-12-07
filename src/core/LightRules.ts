import type {
  RulesAdapter,
  Move,
  Square,
  Color,
  RulesMoveResponse,
  RulesMoveDetail,
} from './types';
import { FILES, RANKS, START_FEN, isWhitePiece, parseFEN, type ParsedFENState } from './utils';
import {
  canRedo,
  canUndo,
  createHistoryStore,
  getCurrentFen,
  getLastMoveState,
  makeMove,
  redo as redoHistory,
  reset as resetHistory,
  undo as undoHistory,
} from './state/historyStore';
function boardToFEN(state: ParsedFENState) {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let s = '';
    let e = 0;
    for (let f = 0; f < 8; f++) {
      const p = state.board[r][f];
      if (p) {
        if (e) {
          s += e;
          e = 0;
        }
        s += p;
      } else {
        e++;
      }
    }
    if (e) s += e;
    rows.push(s);
  }
  return `${rows.join('/')} ${state.turn} ${state.castling || '-'} ${state.ep || '-'} ${state.halfmove || 0} ${
    state.fullmove || 1
  }`;
}

type MoveAccumulator = Array<{ f: number; r: number; ep?: boolean }>;
type OccupancyLookup = (file: number, rank: number) => string | null;
type EnemyDetector = (piece: string | null) => boolean;

interface MoveContext {
  f0: number;
  r0: number;
  isWhite: boolean;
  occ: OccupancyLookup;
  enemy: EnemyDetector;
  pushes: MoveAccumulator;
}

export class LightRules implements RulesAdapter {
  private state = parseFEN(START_FEN);
  private historyStore = createHistoryStore(START_FEN);
  public readonly supportsSanMoves = false;
  private cloneState(state: ParsedFENState): ParsedFENState {
    return {
      board: state.board.map((row) => [...row]),
      turn: state.turn,
      castling: state.castling,
      ep: state.ep,
      halfmove: state.halfmove,
      fullmove: state.fullmove,
    };
  }
  reset() {
    this.state = parseFEN(START_FEN);
    this.historyStore = resetHistory(this.historyStore, boardToFEN(this.state));
  }
  setFEN(f: string) {
    this.state = parseFEN(f);
    this.historyStore = resetHistory(this.historyStore, boardToFEN(this.state));
  }
  getFEN() {
    return getCurrentFen(this.historyStore);
  }
  turn() {
    return this.state.turn;
  }
  pieceAt(square: Square) {
    const f = FILES.indexOf(square[0] as (typeof FILES)[number]);
    const r = RANKS.indexOf(square[1] as (typeof RANKS)[number]);
    return this.state.board[r][f];
  }
  private collectRayMoves(context: MoveContext, df: number, dr: number): void {
    const { f0, r0, occ, enemy, pushes } = context;
    let file = f0 + df;
    let rank = r0 + dr;
    while (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      const target = occ(file, rank);
      if (target) {
        if (enemy(target)) {
          pushes.push({ f: file, r: rank });
        }
        break;
      }
      pushes.push({ f: file, r: rank });
      file += df;
      rank += dr;
    }
  }
  private collectSlidingMoves(
    context: MoveContext,
    directions: ReadonlyArray<readonly [number, number]>,
  ): void {
    for (const [df, dr] of directions) {
      this.collectRayMoves(context, df, dr);
    }
  }
  private collectKnightMoves(context: MoveContext): void {
    const { f0, r0, occ, enemy, pushes } = context;
    for (const [df, dr] of [
      [1, 2],
      [2, 1],
      [-1, 2],
      [-2, 1],
      [1, -2],
      [2, -1],
      [-1, -2],
      [-2, -1],
    ] as const) {
      const file = f0 + df;
      const rank = r0 + dr;
      if (file < 0 || file > 7 || rank < 0 || rank > 7) continue;
      const target = occ(file, rank);
      if (!target || enemy(target)) pushes.push({ f: file, r: rank });
    }
  }
  private collectKingMoves(context: MoveContext): void {
    const { f0, r0, occ, enemy, pushes } = context;
    for (let df = -1; df <= 1; df += 1) {
      for (let dr = -1; dr <= 1; dr += 1) {
        if (!df && !dr) continue;
        const file = f0 + df;
        const rank = r0 + dr;
        if (file < 0 || file > 7 || rank < 0 || rank > 7) continue;
        const target = occ(file, rank);
        if (!target || enemy(target)) pushes.push({ f: file, r: rank });
      }
    }
  }
  private collectPawnMoves(context: MoveContext): void {
    const { f0, r0, isWhite, occ, enemy, pushes } = context;
    const dir = isWhite ? 1 : -1;
    const start = isWhite ? 1 : 6;
    if (!occ(f0, r0 + dir)) pushes.push({ f: f0, r: r0 + dir });
    if (r0 === start && !occ(f0, r0 + dir) && !occ(f0, r0 + 2 * dir)) {
      pushes.push({ f: f0, r: r0 + 2 * dir });
    }
    for (const df of [-1, 1]) {
      const file = f0 + df;
      const rank = r0 + dir;
      if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
        const target = occ(file, rank);
        if (target && enemy(target)) pushes.push({ f: file, r: rank });
      }
    }
    if (this.state.ep && this.state.ep !== '-') {
      const ef = FILES.indexOf(this.state.ep[0] as (typeof FILES)[number]);
      const er = RANKS.indexOf(this.state.ep[1] as (typeof RANKS)[number]);
      if (er === r0 + dir && Math.abs(ef - f0) === 1) pushes.push({ f: ef, r: er, ep: true });
    }
  }
  movesFrom(square: Square): Move[] {
    const piece = this.pieceAt(square);
    if (!piece) return [];
    const isWhite = isWhitePiece(piece);
    const me: Color = isWhite ? 'w' : 'b';
    if (me !== this.state.turn) return [];
    const f0 = FILES.indexOf(square[0] as (typeof FILES)[number]);
    const r0 = RANKS.indexOf(square[1] as (typeof RANKS)[number]);
    const occ: OccupancyLookup = (file: number, rank: number) => this.state.board[rank][file];
    const enemy: EnemyDetector = (pp: string | null) => !!pp && isWhitePiece(pp) !== isWhite;
    const pushes: MoveAccumulator = [];

    const context: MoveContext = { f0, r0, isWhite, occ, enemy, pushes };
    const pieceCode = piece.toLowerCase();

    switch (pieceCode) {
      case 'p': {
        this.collectPawnMoves(context);
        break;
      }
      case 'n': {
        this.collectKnightMoves(context);
        break;
      }
      case 'k': {
        this.collectKingMoves(context);
        break;
      }
      case 'b': {
        this.collectSlidingMoves(context, [
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ]);
        break;
      }
      case 'r': {
        this.collectSlidingMoves(context, [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]);
        break;
      }
      case 'q': {
        this.collectSlidingMoves(context, [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ]);
        break;
      }
      default: {
        break;
      }
    }

    const sq = (f: number, r: number) => (FILES[f] + RANKS[r]) as Square;
    return pushes.map(({ f, r, ep }) => ({
      from: (FILES[f0] + RANKS[r0]) as Square,
      to: sq(f, r),
      ...(ep ? { captured: 'p', ep: true } : {}),
    }));
  }
  move(move: string): RulesMoveResponse;
  move({
    from,
    to,
    promotion,
  }: {
    from: Square;
    to: Square;
    promotion?: Move['promotion'];
  }): RulesMoveResponse;
  move(
    moveData:
      | string
      | {
          from: Square;
          to: Square;
          promotion?: Move['promotion'];
        },
  ): RulesMoveResponse {
    if (typeof moveData === 'string') {
      return { ok: false, reason: 'SAN moves are not supported by LightRules' };
    }

    const { from, to, promotion } = moveData;
    const s = this.cloneState(this.state);
    const f0 = FILES.indexOf(from[0] as (typeof FILES)[number]);
    const r0 = RANKS.indexOf(from[1] as (typeof RANKS)[number]);
    const f1 = FILES.indexOf(to[0] as (typeof FILES)[number]);
    const r1 = RANKS.indexOf(to[1] as (typeof RANKS)[number]);
    const p = s.board[r0][f0];
    if (!p) return { ok: false, reason: 'empty' };
    const isW = isWhitePiece(p);
    if ((isW && s.turn !== 'w') || (!isW && s.turn !== 'b')) return { ok: false, reason: 'turn' };
    const legal = this.movesFrom(from).find((m) => m.to === to);
    if (!legal) return { ok: false, reason: 'illegal' };
    if (legal.ep) {
      const dir = isW ? 1 : -1;
      s.board[r1 - dir][f1] = null;
    }
    s.board[r1][f1] = p;
    s.board[r0][f0] = null;
    if (p.toLowerCase() === 'p' && (r1 === 7 || r1 === 0)) {
      const promo = promotion || 'q';
      s.board[r1][f1] = isW ? promo.toUpperCase() : promo;
    }
    s.turn = s.turn === 'w' ? 'b' : 'w';
    const fen = boardToFEN(s);
    this.historyStore = makeMove(this.historyStore, {
      fen,
      move: { from, to },
    });
    this.state = s; // Update internal state
    return { ok: true, fen, state: s };
  }
  undo(): boolean {
    const { state, previous } = undoHistory(this.historyStore);
    if (!previous) return false;
    this.historyStore = state;
    this.state = parseFEN(getCurrentFen(this.historyStore));
    return true;
  }

  redo(): boolean {
    const { state, next } = redoHistory(this.historyStore);
    if (!next) return false;
    this.historyStore = state;
    this.state = parseFEN(getCurrentFen(this.historyStore));
    return true;
  }

  canUndo(): boolean {
    return canUndo(this.historyStore);
  }

  canRedo(): boolean {
    return canRedo(this.historyStore);
  }

  getLastMove(): RulesMoveDetail | null {
    const moveState = getLastMoveState(this.historyStore);
    if (!moveState?.move) {
      return null;
    }

    return {
      from: moveState.move.from,
      to: moveState.move.to,
      san: moveState.move.san,
    } satisfies RulesMoveDetail;
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
}
