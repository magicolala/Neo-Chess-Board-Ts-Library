// React components and hooks export
export { NeoChessBoard } from './NeoChessBoard';
export type { NeoChessProps, NeoChessRef } from './NeoChessBoard';
export { useNeoChessBoard } from './useNeoChessBoard';
export type {
  UseNeoChessBoardOptions,
  UseNeoChessBoardResult,
  UpdatableBoardOptions,
} from './useNeoChessBoard';

// Re-export core types for convenience
export type {
  BoardOptions,
  Move,
  Piece,
  Square,
  Color,
  Theme,
  RulesAdapter,
  SquareDataType,
} from '../core/types';

export {
  generateBoard,
  rowIndexToChessRow,
  columnIndexToChessColumn,
  chessColumnToColumnIndex,
  chessRowToRowIndex,
} from '../core/utils';
