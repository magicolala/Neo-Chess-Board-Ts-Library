import type { PieceSet } from '../../../src/core/types';

export interface PlaygroundPieceSetMetadata {
  /**
   * Unique identifier persisted in the playground store.
   */
  id: string;
  /**
   * Human readable name shown to users.
   */
  label: string;
  /**
   * Preview image that represents the style of the pack.
   */
  thumbnail: string;
  /**
   * Optional piece set definition to pass to the board. When omitted the
   * NeoChessBoard falls back to the built-in sprites.
   */
  set?: PieceSet;
  /**
   * Helper metadata used by the snippet builder to surface relevant imports.
   */
  snippet?: {
    importName: string;
    importPath: string;
  };
}
