import type { PieceSet } from '../../../src/core/types';
import type { PlaygroundPieceSetMetadata } from './types';

import pixelThumbnail from './thumbnails/pixel.svg';

import whiteKing from './assets/pixel/wK.svg';
import whiteQueen from './assets/pixel/wQ.svg';
import whiteRook from './assets/pixel/wR.svg';
import whiteBishop from './assets/pixel/wB.svg';
import whiteKnight from './assets/pixel/wN.svg';
import whitePawn from './assets/pixel/wP.svg';

import blackKing from './assets/pixel/k.svg';
import blackQueen from './assets/pixel/q.svg';
import blackRook from './assets/pixel/r.svg';
import blackBishop from './assets/pixel/b.svg';
import blackKnight from './assets/pixel/n.svg';
import blackPawn from './assets/pixel/p.svg';

const pixelPieceSet: PieceSet = {
  defaultScale: 0.8,
  pieces: {
    K: { image: whiteKing },
    Q: { image: whiteQueen },
    R: { image: whiteRook },
    B: { image: whiteBishop },
    N: { image: whiteKnight },
    P: { image: whitePawn, offsetY: 0.02 },
    k: { image: blackKing },
    q: { image: blackQueen },
    r: { image: blackRook },
    b: { image: blackBishop },
    n: { image: blackKnight },
    p: { image: blackPawn, offsetY: 0.02 },
  },
};

export const pixelPieceSetMetadata: PlaygroundPieceSetMetadata = {
  id: 'pixel',
  label: 'Pixel Retro',
  thumbnail: pixelThumbnail,
  set: pixelPieceSet,
  snippet: {
    importName: 'pixelPieceSet',
    importPath: './pieces/pixel',
  },
};

export { pixelPieceSet };
