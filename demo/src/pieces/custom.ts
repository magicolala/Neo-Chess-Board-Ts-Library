import type { PieceSet } from '../../../src/core/types';
import type { PlaygroundPieceSetMetadata } from './types';

import customThumbnail from './thumbnails/custom.svg';

import whiteKing from './assets/custom/wK.png';
import whiteQueen from './assets/custom/wQ.png';
import whiteRook from './assets/custom/wR.png';
import whiteBishop from './assets/custom/wB.png';
import whiteKnight from './assets/custom/wN.png';
import whitePawn from './assets/custom/wP.png';

import blackKing from './assets/custom/k.png';
import blackQueen from './assets/custom/q.png';
import blackRook from './assets/custom/r.png';
import blackBishop from './assets/custom/b.png';
import blackKnight from './assets/custom/n.png';
import blackPawn from './assets/custom/p.png';

const customPieceSet: PieceSet = {
  defaultScale: 1,
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

export const customPieceSetMetadata: PlaygroundPieceSetMetadata = {
  id: 'custom',
  label: 'Custom PNG',
  thumbnail: customThumbnail,
  set: customPieceSet,
  snippet: {
    importName: 'customPieceSet',
    importPath: './pieces/custom',
  },
};

export { customPieceSet };
