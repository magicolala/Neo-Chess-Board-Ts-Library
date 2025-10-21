import type { PieceSet } from '../../../src/core/types';
import type { PlaygroundPieceSetMetadata } from './types';

import flatThumbnail from './thumbnails/flat.svg';

import whiteKing from './assets/flat/wK.svg';
import whiteQueen from './assets/flat/wQ.svg';
import whiteRook from './assets/flat/wR.svg';
import whiteBishop from './assets/flat/wB.svg';
import whiteKnight from './assets/flat/wN.svg';
import whitePawn from './assets/flat/wP.svg';

import blackKing from './assets/flat/k.svg';
import blackQueen from './assets/flat/q.svg';
import blackRook from './assets/flat/r.svg';
import blackBishop from './assets/flat/b.svg';
import blackKnight from './assets/flat/n.svg';
import blackPawn from './assets/flat/p.svg';

const flatPieceSet: PieceSet = {
  defaultScale: 0.9,
  pieces: {
    K: { image: whiteKing },
    Q: { image: whiteQueen },
    R: { image: whiteRook },
    B: { image: whiteBishop },
    N: { image: whiteKnight },
    P: { image: whitePawn },
    k: { image: blackKing },
    q: { image: blackQueen },
    r: { image: blackRook },
    b: { image: blackBishop },
    n: { image: blackKnight },
    p: { image: blackPawn },
  },
};

export const flatPieceSetMetadata: PlaygroundPieceSetMetadata = {
  id: 'flat',
  label: 'Flat Contrast',
  thumbnail: flatThumbnail,
  set: flatPieceSet,
  snippet: {
    importName: 'flatPieceSet',
    importPath: './pieces/flat',
  },
};

export { flatPieceSet };
