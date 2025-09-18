import { forwardRef, useImperativeHandle } from 'react';
import type { CSSProperties } from 'react';
import type { NeoChessBoard as Chessboard } from '../core/NeoChessBoard';
import type { BoardOptions, Square } from '../core/types';
import { useNeoChessBoard } from './useNeoChessBoard';
import type { UpdatableBoardOptions } from './useNeoChessBoard';

export interface NeoChessProps extends Omit<BoardOptions, 'fen' | 'rulesAdapter'> {
  fen?: string;
  className?: string;
  style?: CSSProperties;
  onMove?: (e: { from: Square; to: Square; fen: string }) => void;
  onIllegal?: (e: { from: Square; to: Square; reason: string }) => void;
  onUpdate?: (e: { fen: string }) => void;
}

export interface NeoChessRef {
  // Core methods
  getBoard: () => Chessboard | null;

  // Board manipulation methods
  addArrow: (arrow: { from: Square; to: Square; color?: string }) => void;
  addHighlight: (square: Square, type: string) => void;
  clearArrows: () => void;
  clearHighlights: () => void;
}

export const NeoChessBoard = forwardRef<NeoChessRef, NeoChessProps>(
  ({ fen, className, style, onMove, onIllegal, onUpdate, ...restOptions }, ref) => {
    const options = restOptions as UpdatableBoardOptions;

    const { containerRef, api } = useNeoChessBoard({
      fen,
      options,
      onMove,
      onIllegal,
      onUpdate,
    });

    useImperativeHandle(ref, () => api, [api]);

    return <div ref={containerRef} className={className} style={style} />;
  },
);

NeoChessBoard.displayName = 'NeoChessBoard';
