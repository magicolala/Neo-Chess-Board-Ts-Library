import type { PieceSet } from '../../../src/core/types';
import type { PlaygroundPieceSetMetadata } from './types';

import glossyThumbnail from './thumbnails/glossy.svg';

import whiteKing from './assets/glossy/wK.svg';
import whiteQueen from './assets/glossy/wQ.svg';
import whiteRook from './assets/glossy/wR.svg';
import whiteBishop from './assets/glossy/wB.svg';
import whiteKnight from './assets/glossy/wN.svg';
import whitePawn from './assets/glossy/wP.svg';

import blackKing from './assets/glossy/k.svg';
import blackQueen from './assets/glossy/q.svg';
import blackRook from './assets/glossy/r.svg';
import blackBishop from './assets/glossy/b.svg';
import blackKnight from './assets/glossy/n.svg';
import blackPawn from './assets/glossy/p.svg';

const glossyPieceSet: PieceSet = {
  defaultScale: 1,
  pieces: {
    K: { image: whiteKing, scale: 0.94 },
    Q: { image: whiteQueen, scale: 0.94 },
    R: { image: whiteRook, scale: 0.94 },
    B: { image: whiteBishop, scale: 0.94 },
    N: { image: whiteKnight, scale: 0.94 },
    P: { image: whitePawn, scale: 0.94 },
    k: { image: blackKing, scale: 0.94 },
    q: { image: blackQueen, scale: 0.94 },
    r: { image: blackRook, scale: 0.94 },
    b: { image: blackBishop, scale: 0.94 },
    n: { image: blackKnight, scale: 0.94 },
    p: { image: blackPawn, scale: 0.94 },
  },
};

export const glossyPieceSetMetadata: PlaygroundPieceSetMetadata = {
  id: 'glossy',
  label: 'Glossy Gradient',
  thumbnail: glossyThumbnail,
  set: glossyPieceSet,
  snippet: {
    importName: 'glossyPieceSet',
    importPath: './pieces/glossy',
  },
};

export { glossyPieceSet };
