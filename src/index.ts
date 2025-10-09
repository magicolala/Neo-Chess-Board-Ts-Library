export * from './core/types';
export * from './core/themes';
export * from './core/EventBus';
export * from './core/LightRules';
export * from './core/ChessJsRules';
export * from './core/PgnNotation';
export * from './core/FlatSprites';
export * from './core/PGN';
export * from './core/utils';
export * from './core/NeoChessBoard';

// React bindings are exposed with distinct names to avoid conflicts with the core class.
export { NeoChessBoard as NeoChessBoardReact } from './react/NeoChessBoard';
export type {
  NeoChessProps as NeoChessBoardReactProps,
  NeoChessRef as NeoChessBoardReactRef,
} from './react/NeoChessBoard';
export { useNeoChessBoard } from './react/useNeoChessBoard';
export type {
  UseNeoChessBoardOptions,
  UseNeoChessBoardResult,
  UpdatableBoardOptions,
} from './react/useNeoChessBoard';
