import React, { useEffect, useRef } from "react";
import { NeoChessBoard as Chessboard } from '../core/NeoChessBoard';
import type { BoardOptions, Move, Square } from "../core/types";

export interface NeoChessProps extends Omit<BoardOptions, "fen" | "rulesAdapter"> {
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
    const b = new Chessboard(ref.current, { ...opts, fen });
    boardRef.current = b;
    const off1 = b.on("move", (e) => onMove?.(e));
    const off2 = b.on("illegal", (e) => onIllegal?.(e));
    const off3 = b.on("update", (e) => onUpdate?.(e));
    return () => {
      off1?.();
      off2?.();
      off3?.();
      b.destroy();
    };
  }, []);

  useEffect(() => {
    if (!boardRef.current || !fen) return;
    boardRef.current.setPosition(fen);
  }, [fen]);

  return <div ref={ref} className={className} style={style} />;
};
