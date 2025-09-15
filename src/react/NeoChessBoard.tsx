import React, { useEffect, useRef } from 'react';
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

export const NeoChessBoard: React.FC<NeoChessProps> = ({
  fen,
  className,
  style,
  onMove,
  onIllegal,
  onUpdate,
  ...opts
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<Chessboard | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (!boardRef.current) {
      const b = new Chessboard(ref.current, { ...opts, fen });
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
      // Other options like interactive, showCoordinates, etc., are not designed to be changed after initialization.
      // If they need to be changed, the board instance would need to be re-created.
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

  return <div ref={ref} className={className} style={style} />;
};
