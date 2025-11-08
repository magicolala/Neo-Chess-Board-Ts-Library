export interface NeoChessErrorOptions {
  readonly cause?: unknown;
  readonly details?: Record<string, unknown>;
}

export class NeoChessError extends Error {
  public readonly code: string;
  public readonly details?: Readonly<Record<string, unknown>>;

  constructor(message: string, code: string, options: NeoChessErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;

    if (options.details) {
      this.details = Object.freeze({ ...options.details });
    }

    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export type FenErrorCode =
  | 'INVALID_FEN_GENERIC'
  | 'INVALID_FEN_EMPTY'
  | 'INVALID_FEN_FIELD_COUNT'
  | 'INVALID_FEN_BOARD_EMPTY'
  | 'INVALID_FEN_INVALID_EMPTY_SQUARE_COUNT'
  | 'INVALID_FEN_INVALID_PIECE'
  | 'INVALID_FEN_RANK_NO_SQUARES'
  | 'INVALID_FEN_INCONSISTENT_ROW_LENGTH'
  | 'INVALID_FEN_ACTIVE_COLOR';

export interface FenErrorDetails extends Record<string, unknown> {
  fen?: string;
  rank?: number;
  row?: string;
  digits?: string;
  character?: string;
  expectedFiles?: number;
  actualFiles?: number;
  fieldValue?: string;
}

export class FenValidationError extends NeoChessError {
  declare public readonly code: FenErrorCode;
  declare public readonly details?: Readonly<FenErrorDetails>;

  constructor(message: string, code: FenErrorCode, details?: FenErrorDetails) {
    super(message, code, { details });
  }
}

export class InvalidFENError extends FenValidationError {
  declare public readonly code: FenErrorCode;
  declare public readonly details?: Readonly<FenErrorDetails>;

  constructor(
    message: string,
    code: FenErrorCode = 'INVALID_FEN_GENERIC',
    details?: FenErrorDetails,
  ) {
    super(message, code, details);
    this.name = 'InvalidFENError';
  }
}

export type PgnParseErrorCode =
  | 'PGN_PARSE_UNTERMINATED_COMMENT'
  | 'PGN_PARSE_INVALID_ARROW_SPEC'
  | 'PGN_PARSE_INVALID_ARROW_SQUARE'
  | 'PGN_PARSE_INVALID_CIRCLE_SPEC'
  | 'PGN_PARSE_INVALID_CIRCLE_SQUARE'
  | 'PGN_PARSE_MOVE_TEXT_MISSING'
  | 'PGN_PARSE_RESULT_IN_MOVE'
  | 'PGN_IMPORT_FAILED';

export interface PgnParseErrorDetails extends Record<string, unknown> {
  moveNumber?: number;
  color?: 'white' | 'black';
  spec?: string;
  square?: string;
  rawComment?: string;
  index?: number;
  message?: string;
}

export class PgnParseError extends NeoChessError {
  declare public readonly code: PgnParseErrorCode;
  declare public readonly details?: Readonly<PgnParseErrorDetails>;

  constructor(message: string, code: PgnParseErrorCode, options: NeoChessErrorOptions = {}) {
    super(message, code, options);
    this.name = 'PgnParseError';
  }
}
