import { Chess } from 'chess.js';
import type { PromotionPiece, MoveNotation, RulesAdapter, Square } from './types';

const COORDINATE_MOVE_REGEX = /^([a-h][1-8])\s*[- ]?\s*([a-h][1-8])(?:=?(q|r|b|n))?$/i;

export type NormalizedNotationMove = {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
  san?: string;
};

type NotationEngineMove = {
  from: Square;
  to: Square;
  promotion?: string | undefined;
  san?: string;
};

type NotationMoveInput =
  | string
  | {
      from: Square;
      to: Square;
      promotion?: string | undefined;
    }
  | null;

type NotationEngine = {
  move: (input: NotationMoveInput, options?: { strict?: boolean }) => NotationEngineMove | null;
};

export type NotationEngineFactory = (fen: string) => NotationEngine;

export class RuleEngine {
  constructor(
    private readonly getRules: () => RulesAdapter,
    private readonly createNotationEngine: NotationEngineFactory = (fen) => new Chess(fen),
  ) {}

  public parseCoordinateNotation(
    notation: string,
  ): { from: Square; to: Square; promotion?: PromotionPiece } | null {
    const cleaned = notation.trim();
    if (!cleaned) return null;

    const match = COORDINATE_MOVE_REGEX.exec(cleaned);
    if (!match) return null;

    return {
      from: match[1] as Square,
      to: match[2] as Square,
      promotion: match[3]?.toLowerCase() as PromotionPiece | undefined,
    };
  }

  public convertMoveNotation(
    notation: string,
    from: MoveNotation,
    to: MoveNotation,
  ): string | null {
    const normalizedFrom = from.toLowerCase() as MoveNotation;
    const normalizedTo = to.toLowerCase() as MoveNotation;

    if (!notation.trim()) {
      return null;
    }

    if (normalizedFrom === normalizedTo) {
      return notation.trim();
    }

    const normalizedMove = this.normalizeNotationInput(notation, normalizedFrom);
    if (!normalizedMove) {
      return null;
    }

    switch (normalizedTo) {
      case 'san': {
        return this.resolveSanFromMove(normalizedMove);
      }
      case 'uci': {
        return this.formatUciFromMove(normalizedMove);
      }
      case 'coord': {
        return this.formatCoordinateFromMove(normalizedMove);
      }
      default: {
        return null;
      }
    }
  }

  public sanToUci(san: string): string | null {
    return this.convertMoveNotation(san, 'san', 'uci');
  }

  public sanToCoordinates(san: string): string | null {
    return this.convertMoveNotation(san, 'san', 'coord');
  }

  public uciToSan(uci: string): string | null {
    return this.convertMoveNotation(uci, 'uci', 'san');
  }

  public uciToCoordinates(uci: string): string | null {
    return this.convertMoveNotation(uci, 'uci', 'coord');
  }

  private normalizeNotationInput(
    notation: string,
    from: MoveNotation,
  ): NormalizedNotationMove | null {
    if (from === 'san') {
      return this.normalizeMoveFromSan(notation);
    }

    if (from === 'uci' || from === 'coord') {
      const parsed = this.parseCoordinateNotation(notation);
      if (!parsed) {
        return null;
      }

      return {
        from: parsed.from.toLowerCase() as Square,
        to: parsed.to.toLowerCase() as Square,
        promotion: parsed.promotion,
      };
    }

    return null;
  }

  private resolveSanFromMove(move: NormalizedNotationMove): string | null {
    if (move.san) {
      return move.san;
    }

    const chess = this.createNotationChess();
    if (!chess) {
      return null;
    }

    try {
      const result = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });

      return result?.san ?? null;
    } catch {
      return null;
    }
  }

  private formatUciFromMove(move: NormalizedNotationMove): string | null {
    if (!move.from || !move.to) {
      return null;
    }

    const promotion = move.promotion ? move.promotion.toLowerCase() : '';
    return `${move.from}${move.to}${promotion}`;
  }

  private formatCoordinateFromMove(move: NormalizedNotationMove): string | null {
    return this.formatUciFromMove(move);
  }

  private createNotationChess(): NotationEngine | null {
    try {
      const fen = this.getRules().getFEN();
      return this.createNotationEngine(fen);
    } catch {
      return null;
    }
  }

  private normalizeMoveFromSan(san: string): NormalizedNotationMove | null {
    const chess = this.createNotationChess();
    if (!chess) {
      return null;
    }

    try {
      const move = chess.move(san);
      if (!move) {
        return null;
      }

      return {
        from: move.from as Square,
        to: move.to as Square,
        promotion: (move.promotion as PromotionPiece | undefined) ?? undefined,
        san: move.san,
      };
    } catch {
      return null;
    }
  }
}
