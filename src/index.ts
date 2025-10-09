export * from './core/types';
export * from './core/themes';
export * from './core/EventBus';
export * from './core/LightRules';
export * from './core/ChessJsRules';
export * from './core/PgnNotation';
export * from './core/FlatSprites';
export * from './core/PGN';
export * from './core/utils';
export { NeoChessBoard as NeoChessBoardCore } from './core/NeoChessBoard';

// React bindings remain available under their original names for backwards compatibility,
// and are also aliased with the `NeoChessBoardReact*` identifiers for clarity when both APIs
// are consumed in the same project.
export { NeoChessBoard } from './react/NeoChessBoard';
export type { NeoChessProps, NeoChessRef } from './react/NeoChessBoard';
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
