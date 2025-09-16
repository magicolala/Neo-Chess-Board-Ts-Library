import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { NeoChessBoard as Chessboard } from '../core/NeoChessBoard';
import type { BoardOptions, Move, Square } from '../core/types';

export interface NeoChessProps extends Omit<BoardOptions, 'fen' | 'rulesAdapter'> {
  fen?: string;
  className?: string;
  style?: React.CSSProperties;
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
  ({ fen, className, style, onMove, onIllegal, onUpdate, ...opts }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const boardRef = useRef<Chessboard | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      if (!boardRef.current) {
        const b = new Chessboard(containerRef.current, { ...opts, fen });
        boardRef.current = b;
      } else {
        // Update individual options that can be changed after initialization
        if (fen !== undefined && boardRef.current.getPosition() !== fen) {
          boardRef.current.setFEN(fen);
        }
        if (opts.theme !== undefined) {
          boardRef.current.setTheme(opts.theme as string);
        }
        if (opts.soundEnabled !== undefined) {
          boardRef.current.setSoundEnabled(opts.soundEnabled);
        }
        if (opts.orientation !== undefined) {
          boardRef.current.setOrientation(opts.orientation);
        }
        if (opts.showArrows !== undefined) {
          boardRef.current.setShowArrows(opts.showArrows);
        }
        if (opts.showHighlights !== undefined) {
          boardRef.current.setShowHighlights(opts.showHighlights);
        }
        if (opts.allowPremoves !== undefined) {
          boardRef.current.setAllowPremoves(opts.allowPremoves);
        }
        if (opts.highlightLegal !== undefined) {
          boardRef.current.setHighlightLegal(opts.highlightLegal);
        }
        if (opts.showSquareNames !== undefined) {
          boardRef.current.setShowSquareNames(opts.showSquareNames);
        }
      }

      const off1 = boardRef.current.on('move', (e) => onMove?.(e));
      const off2 = boardRef.current.on('illegal', (e) => onIllegal?.(e));
      const off3 = boardRef.current.on('update', (e) => onUpdate?.(e));

      return () => {
        off1?.();
        off2?.();
        off3?.();
      };
    }, [fen, opts, onMove, onIllegal, onUpdate]);

    useEffect(() => {
      return () => {
        boardRef.current?.destroy();
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getBoard: () => boardRef.current,
        addArrow: (arrow: { from: Square; to: Square; color?: string }) => {
          return boardRef.current?.addArrow?.(arrow);
        },
        addHighlight: (square: Square, type: string) => {
          return boardRef.current?.addHighlight?.(square, type);
        },
        clearArrows: () => {
          return boardRef.current?.clearArrows?.();
        },
        clearHighlights: () => {
          return boardRef.current?.clearHighlights?.();
        },
      }),
      [],
    );

    return <div ref={containerRef} className={className} style={style} />;
  },
);

NeoChessBoard.displayName = 'NeoChessBoard';
