import { forwardRef, useImperativeHandle, useMemo, useRef, useEffect } from 'react';
import { isValidElement, type CSSProperties, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { NeoChessBoard as Chessboard } from '../core/NeoChessBoard';
import type {
  BoardEventMap,
  BoardOptions,
  ClockConfig,
  ClockState,
  Color,
  Piece,
  PieceRendererMap,
  PieceRendererParams,
  Square,
  SquareRendererParams,
} from '../core/types';
import { useNeoChessBoard } from './useNeoChessBoard';
import type { UpdatableBoardOptions } from './useNeoChessBoard';

type ReactSquareRenderer = (
  params: SquareRendererParams & { board: Chessboard | null },
) => ReactNode | void;

type ReactPieceRenderer =
  | ((params: PieceRendererParams & { board: Chessboard | null }) => ReactNode | void)
  | ReactNode;

type ReactPieceRendererMap = Partial<Record<Piece, ReactPieceRenderer>>;

function isPieceRendererFunction(
  renderer: ReactPieceRenderer,
): renderer is (params: PieceRendererParams & { board: Chessboard | null }) => ReactNode | void {
  return typeof renderer === 'function';
}

function normalizeInlineStyle(
  style?: CSSProperties | BoardOptions['boardStyle'],
): BoardOptions['boardStyle'] | undefined {
  if (!style) {
    return undefined;
  }
  const normalized: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(style)) {
    if (value === null || value === undefined) {
      continue;
    }
    normalized[key] = value as string | number;
  }
  return normalized;
}

function normalizeCssStyle(
  style?: CSSProperties | BoardOptions['boardStyle'],
): CSSProperties | undefined {
  if (!style) {
    return undefined;
  }
  const normalized: CSSProperties = {};
  for (const [key, value] of Object.entries(style)) {
    if (value === null || value === undefined) {
      continue;
    }
    normalized[key as keyof CSSProperties] = value as never;
  }
  return normalized;
}

type RootEntry = {
  root: Root;
  unmountId?: ReturnType<typeof setTimeout>;
};

function scheduleRootUnmount(
  element: HTMLElement,
  entry: RootEntry,
  roots: Map<HTMLElement, RootEntry>,
  onComplete?: () => void,
): void {
  if (entry.unmountId) {
    clearTimeout(entry.unmountId);
  }
  entry.unmountId = setTimeout(() => {
    entry.unmountId = undefined;
    entry.root.unmount();
    roots.delete(element);
    onComplete?.();
  });
}

function unmountRoots(map: Map<HTMLElement, RootEntry>): void {
  for (const [element, entry] of map) {
    scheduleRootUnmount(element, entry, map);
  }
}

function getOrCreateRootEntry(element: HTMLElement, roots: Map<HTMLElement, RootEntry>): RootEntry {
  const entry = roots.get(element);
  if (entry) {
    if (entry.unmountId) {
      clearTimeout(entry.unmountId);
      entry.unmountId = undefined;
    }
    return entry;
  }
  const newEntry: RootEntry = { root: createRoot(element) };
  roots.set(element, newEntry);
  return newEntry;
}

function renderReactContent(
  element: HTMLElement,
  content: ReactNode,
  roots: Map<HTMLElement, RootEntry>,
): void {
  const entry = getOrCreateRootEntry(element, roots);
  entry.root.render(content);
}

function unmountReactContent(
  element: HTMLElement,
  roots: Map<HTMLElement, RootEntry>,
  onUnmount?: () => void,
): void {
  const entry = roots.get(element);
  if (entry) {
    scheduleRootUnmount(element, entry, roots, onUnmount);
    return;
  }
  onUnmount?.();
}

function isDomNode(value: unknown): value is Node {
  return typeof Node !== 'undefined' && value instanceof Node;
}

function handleRendererResult(
  result: unknown,
  element: HTMLElement,
  roots: Map<HTMLElement, RootEntry>,
): void {
  if (result === undefined) {
    return;
  }
  if (result === null) {
    unmountReactContent(element, roots, () => {
      element.innerHTML = '';
    });
    return;
  }
  if (isValidElement(result)) {
    renderReactContent(element, result, roots);
    return;
  }
  if (isDomNode(result)) {
    unmountReactContent(element, roots, () => {
      element.innerHTML = '';
      element.append(result);
    });
    return;
  }
  if (typeof result === 'string' || typeof result === 'number') {
    unmountReactContent(element, roots, () => {
      element.textContent = String(result);
    });
    return;
  }

  renderReactContent(element, result as ReactNode, roots);
}

export interface NeoChessProps
  extends Omit<
    BoardOptions,
    'fen' | 'position' | 'rulesAdapter' | 'squareRenderer' | 'pieces' | 'boardStyle'
  > {
  fen?: string;
  position?: string;
  className?: string;
  style?: CSSProperties;
  boardStyle?: CSSProperties | BoardOptions['boardStyle'];
  boardOrientation?: BoardOptions['orientation'];
  squareRenderer?: BoardOptions['squareRenderer'] | ReactSquareRenderer;
  pieces?: BoardOptions['pieces'] | ReactPieceRendererMap;
  onMove?: (e: BoardEventMap['move']) => void;
  onIllegal?: (e: BoardEventMap['illegal']) => void;
  onUpdate?: (e: BoardEventMap['update']) => void;
  onSquareClick?: (e: BoardEventMap['squareClick']) => void;
  onSquareMouseDown?: (e: BoardEventMap['squareMouseDown']) => void;
  onSquareMouseUp?: (e: BoardEventMap['squareMouseUp']) => void;
  onSquareRightClick?: (e: BoardEventMap['squareRightClick']) => void;
  onSquareMouseOver?: (e: BoardEventMap['squareMouseOver']) => void;
  onSquareMouseOut?: (e: BoardEventMap['squareMouseOut']) => void;
  onPieceClick?: (e: BoardEventMap['pieceClick']) => void;
  onPieceDrag?: (e: BoardEventMap['pieceDrag']) => void;
  onPieceDrop?: (e: BoardEventMap['pieceDrop']) => void;
  onClockChange?: (state: ClockState) => void;
  onClockStart?: () => void;
  onClockPause?: () => void;
  onClockFlag?: (e: BoardEventMap['clock:flag']) => void;
}

export interface NeoChessRef {
  // Core methods
  getBoard: () => Chessboard | null;

  // Board manipulation methods
  addArrow: (arrow: { from: Square; to: Square; color?: string }) => void;
  addHighlight: (square: Square, type: string) => void;
  clearArrows: () => void;
  clearHighlights: () => void;
  getClockState: () => ClockState | null;
  startClock: () => void;
  pauseClock: () => void;
  setClockTime: (color: Color, milliseconds: number) => void;
  addClockTime: (color: Color, milliseconds: number) => void;
  resetClock: (config?: Partial<ClockConfig> | null) => void;
}

export const NeoChessBoard = forwardRef<NeoChessRef, NeoChessProps>(
  (
    {
      fen,
      position,
      className,
      style,
      boardStyle: boardStyleProp,
      boardOrientation,
      squareRenderer: squareRendererProp,
      pieces: piecesProp,
      id: elementId,
      onMove,
      onIllegal,
      onUpdate,
      onSquareClick,
      onSquareMouseDown,
      onSquareMouseUp,
      onSquareRightClick,
      onSquareMouseOver,
      onSquareMouseOut,
      onPieceClick,
      onPieceDrag,
      onPieceDrop,
      onClockChange,
      onClockStart,
      onClockPause,
      onClockFlag,
      size,
      ...restOptions
    },
    ref,
  ) => {
    const squareRendererRootsRef = useRef<Map<HTMLElement, RootEntry>>(new Map());
    const pieceRendererRootsRef = useRef<Map<HTMLElement, RootEntry>>(new Map());

    const normalizedBoardStyle = useMemo(
      () => normalizeInlineStyle(boardStyleProp),
      [boardStyleProp],
    );
    const boardCssStyle = useMemo(() => normalizeCssStyle(boardStyleProp), [boardStyleProp]);

    const normalizedSquareRenderer = useMemo<BoardOptions['squareRenderer'] | undefined>(() => {
      if (squareRendererProp === undefined) {
        return;
      }
      if (!squareRendererProp) {
        return;
      }
      return (params) => {
        if (typeof squareRendererProp === 'function') {
          const result = (squareRendererProp as ReactSquareRenderer)(params);
          handleRendererResult(result, params.element, squareRendererRootsRef.current);
        } else {
          handleRendererResult(squareRendererProp, params.element, squareRendererRootsRef.current);
        }
      };
    }, [squareRendererProp]);

    const normalizedPieceRenderers = useMemo<BoardOptions['pieces'] | undefined>(() => {
      if (piecesProp === undefined) {
        return;
      }
      if (!piecesProp) {
        return;
      }
      const mapped: PieceRendererMap = {};
      let hasRenderer = false;
      for (const [pieceKey, renderer] of Object.entries(piecesProp)) {
        if (renderer === null || renderer === undefined) {
          continue;
        }
        hasRenderer = true;
        if (isPieceRendererFunction(renderer)) {
          mapped[pieceKey as Piece] = (params) => {
            const result = renderer(params);
            handleRendererResult(result, params.element, pieceRendererRootsRef.current);
          };
        } else {
          mapped[pieceKey as Piece] = (params) => {
            handleRendererResult(renderer, params.element, pieceRendererRootsRef.current);
          };
        }
      }
      return hasRenderer ? mapped : undefined;
    }, [piecesProp]);

    const options = useMemo<UpdatableBoardOptions>(() => {
      const typedOptions = { ...restOptions } as UpdatableBoardOptions;
      if (typeof size === 'number') {
        typedOptions.size = size;
      }
      typedOptions.id = elementId;
      typedOptions.boardOrientation = boardOrientation;
      if (boardOrientation !== undefined) {
        typedOptions.orientation = boardOrientation;
      }
      if (position !== undefined) {
        typedOptions.position = position;
      }
      typedOptions.boardStyle = normalizedBoardStyle;
      typedOptions.squareRenderer = normalizedSquareRenderer;
      typedOptions.pieces = normalizedPieceRenderers;
      return typedOptions;
    }, [
      restOptions,
      size,
      elementId,
      boardOrientation,
      position,
      normalizedBoardStyle,
      normalizedSquareRenderer,
      normalizedPieceRenderers,
    ]);

    const computedStyle = useMemo<CSSProperties | undefined>(() => {
      const columnCountRaw = options.chessboardColumns ?? restOptions.chessboardColumns;
      const rowCountRaw = options.chessboardRows ?? restOptions.chessboardRows;
      const columnCount = Math.max(
        1,
        Math.floor(
          typeof columnCountRaw === 'number' && Number.isFinite(columnCountRaw)
            ? columnCountRaw
            : typeof rowCountRaw === 'number' && Number.isFinite(rowCountRaw)
              ? rowCountRaw
              : 8,
        ),
      );
      const rowCount = Math.max(
        1,
        Math.floor(
          typeof rowCountRaw === 'number' && Number.isFinite(rowCountRaw)
            ? rowCountRaw
            : columnCount,
        ),
      );
      const aspectRatioValue = `${columnCount} / ${rowCount}`;

      let merged: CSSProperties | undefined = { aspectRatio: aspectRatioValue };
      if (typeof size === 'number' && !Number.isNaN(size) && size > 0) {
        const roundedSize = Math.round(size);
        const heightLimit = Math.round((roundedSize * rowCount) / columnCount);
        merged = {
          width: '100%',
          maxWidth: `${roundedSize}px`,
          maxHeight: `${heightLimit}px`,
          aspectRatio: aspectRatioValue,
        };
      }
      if (style) {
        merged = merged ? { ...merged, ...style } : { ...style };
      }
      if (boardCssStyle) {
        merged = merged ? { ...merged, ...boardCssStyle } : { ...boardCssStyle };
      }
      return merged;
    }, [
      size,
      style,
      boardCssStyle,
      options.chessboardColumns,
      options.chessboardRows,
      restOptions.chessboardColumns,
      restOptions.chessboardRows,
    ]);

    const resolvedFen = fen ?? position;

    const { containerRef, isReady, api } = useNeoChessBoard({
      fen: resolvedFen,
      position,
      options,
      onMove,
      onIllegal,
      onUpdate,
      onSquareClick,
      onSquareMouseDown,
      onSquareMouseUp,
      onSquareRightClick,
      onSquareMouseOver,
      onSquareMouseOut,
      onPieceClick,
      onPieceDrag,
      onPieceDrop,
      onClockChange,
      onClockStart,
      onClockPause,
      onClockFlag,
    });

    useEffect(() => {
      if (!squareRendererProp) {
        unmountRoots(squareRendererRootsRef.current);
      }
    }, [squareRendererProp]);

    useEffect(() => {
      if (!piecesProp) {
        unmountRoots(pieceRendererRootsRef.current);
      }
    }, [piecesProp]);

    useEffect(() => {
      if (!isReady) {
        unmountRoots(squareRendererRootsRef.current);
        unmountRoots(pieceRendererRootsRef.current);
      }
    }, [isReady]);

    useEffect(
      () => () => {
        unmountRoots(squareRendererRootsRef.current);
        unmountRoots(pieceRendererRootsRef.current);
      },
      [],
    );

    useImperativeHandle(ref, () => api, [api]);

    return <div ref={containerRef} id={elementId} className={className} style={computedStyle} />;
  },
);

NeoChessBoard.displayName = 'NeoChessBoard';
