import type { PieceSet } from '../../../src/core/types';
import builtinThumbnail from './thumbnails/builtin.svg';
import { flatPieceSet, flatPieceSetMetadata } from './flat';
import { glossyPieceSet, glossyPieceSetMetadata } from './glossy';
import { pixelPieceSet, pixelPieceSetMetadata } from './pixel';
import type { PlaygroundPieceSetMetadata } from './types';

export type { PlaygroundPieceSetMetadata } from './types';

export const BUILTIN_PIECE_SET_ID = 'builtin';

const builtinPieceSetMetadata: PlaygroundPieceSetMetadata = {
  id: BUILTIN_PIECE_SET_ID,
  label: 'Default Sprites',
  thumbnail: builtinThumbnail,
  set: undefined,
};

export const playgroundPieceSets: PlaygroundPieceSetMetadata[] = [
  builtinPieceSetMetadata,
  flatPieceSetMetadata,
  glossyPieceSetMetadata,
  pixelPieceSetMetadata,
];

export const pieceSetById = new Map<string, PlaygroundPieceSetMetadata>(
  playgroundPieceSets.map((metadata) => [metadata.id, metadata]),
);

export const pieceSetValueById = new Map<string, PieceSet | undefined>([
  [builtinPieceSetMetadata.id, undefined],
  [flatPieceSetMetadata.id, flatPieceSet],
  [glossyPieceSetMetadata.id, glossyPieceSet],
  [pixelPieceSetMetadata.id, pixelPieceSet],
]);

export const pieceSetSnippetById = new Map<string, PlaygroundPieceSetMetadata['snippet']>(
  playgroundPieceSets.map((metadata) => [metadata.id, metadata.snippet]),
);

/**
 * Any missing piece codes are intentionally left undefined so the board can
 * fall back to its baked-in sprite sheet. This mirrors how PieceSet behaves in
 * production: the default art is used whenever a custom asset is absent.
 */
export const playgroundPieceSetFallbackNote =
  'Pieces that are not provided by a custom pack will automatically use the default NeoChessBoard sprites.';
