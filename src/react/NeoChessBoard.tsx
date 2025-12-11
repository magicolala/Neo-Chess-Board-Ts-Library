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
  CaptureEffectRenderer,
  CaptureEffectRendererParams,
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

type ReactCaptureEffectRenderer = (params: CaptureEffectRendererParams) => ReactNode | void;

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

function scheduleRootUnmount(root: Root, onComplete?: () => void): void {
  setTimeout(() => {
    root.unmount();
    onComplete?.();
  });
}

function unmountRoots(map: Map<HTMLElement, Root>): void {
  for (const root of map.values()) {
    scheduleRootUnmount(root);
  }
  map.clear();
}

function renderReactContent(
  element: HTMLElement,
  content: ReactNode,
  roots: Map<HTMLElement, Root>,
): void {
  let root = roots.get(element);
  if (!root) {
    root = createRoot(element);
    roots.set(element, root);
  }
  root.render(content);
}

function unmountReactContent(
  element: HTMLElement,
  roots: Map<HTMLElement, Root>,
  onUnmount?: () => void,
): void {
  const root = roots.get(element);
  if (root) {
    roots.delete(element);
    scheduleRootUnmount(root, onUnmount);
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
  roots: Map<HTMLElement, Root>,
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
  captureEffectRenderer?: ReactCaptureEffectRenderer;
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
  onPuzzleLoad?: (event: BoardEventMap['puzzle:load']) => void;
  onPuzzleMove?: (event: BoardEventMap['puzzle:move']) => void;
  onPuzzleHint?: (event: BoardEventMap['puzzle:hint']) => void;
  onPuzzleComplete?: (event: BoardEventMap['puzzle:complete']) => void;
  onPuzzlePersistenceWarning?: (event: BoardEventMap['puzzle:persistence-warning']) => void;
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
      onPuzzleLoad,
      onPuzzleMove,
      onPuzzleHint,
      onPuzzleComplete,
      onPuzzlePersistenceWarning,
      size,
      captureEffectRenderer: captureEffectRendererProp,
      ...restOptions
    },
    ref,
  ) => {
    const squareRendererRootsRef = useRef<Map<HTMLElement, Root>>(new Map());
    const pieceRendererRootsRef = useRef<Map<HTMLElement, Root>>(new Map());
    const captureEffectRootsRef = useRef<Map<HTMLElement, Root>>(new Map());

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
        if (renderer == null) {
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

    const normalizedCaptureEffectRenderer = useMemo<CaptureEffectRenderer | undefined>(() => {
      if (captureEffectRendererProp === undefined) {
        return;
      }
      if (!captureEffectRendererProp) {
        return;
      }
      return (params) => {
        const result = captureEffectRendererProp(params);
        handleRendererResult(result, params.container, captureEffectRootsRef.current);
        return () => {
          unmountReactContent(params.container, captureEffectRootsRef.current);
        };
      };
    }, [captureEffectRendererProp]);

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
      const captureRenderer = normalizedCaptureEffectRenderer;
      if (captureRenderer) {
        typedOptions.captureEffect = restOptions.captureEffect
          ? { ...restOptions.captureEffect, renderer: captureRenderer }
          : { renderer: captureRenderer };
      } else if (restOptions.captureEffect) {
        typedOptions.captureEffect = { ...restOptions.captureEffect };
      }
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
      normalizedCaptureEffectRenderer,
    ]);

    const columnCountRaw = options.chessboardColumns ?? restOptions.chessboardColumns;
    const rowCountRaw = options.chessboardRows ?? restOptions.chessboardRows;

    const computedStyle = useMemo<CSSProperties | undefined>(() => {
      const hasValidColumnCount =
        typeof columnCountRaw === 'number' && Number.isFinite(columnCountRaw);
      const hasValidRowCount = typeof rowCountRaw === 'number' && Number.isFinite(rowCountRaw);

      let columnCountCandidate: number | undefined = hasValidColumnCount
        ? columnCountRaw
        : undefined;
      if (!columnCountCandidate && hasValidRowCount) {
        columnCountCandidate = rowCountRaw;
      }
      const columnCount = Math.max(1, Math.floor(columnCountCandidate ?? 8));

      const rowCountCandidate = hasValidRowCount ? rowCountRaw : columnCount;
      const rowCount = Math.max(1, Math.floor(rowCountCandidate));
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
    }, [boardCssStyle, columnCountRaw, rowCountRaw, size, style]);

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
      onPuzzleLoad,
      onPuzzleMove,
      onPuzzleHint,
      onPuzzleComplete,
      onPuzzlePersistenceWarning,
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
      if (!captureEffectRendererProp) {
        unmountRoots(captureEffectRootsRef.current);
      }
    }, [captureEffectRendererProp]);

    useEffect(() => {
      if (!isReady) {
        unmountRoots(squareRendererRootsRef.current);
        unmountRoots(pieceRendererRootsRef.current);
        unmountRoots(captureEffectRootsRef.current);
      }
    }, [isReady]);

    useEffect(
      () => () => {
        unmountRoots(squareRendererRootsRef.current);
        unmountRoots(pieceRendererRootsRef.current);
        unmountRoots(captureEffectRootsRef.current);
      },
      [],
    );

    useImperativeHandle(ref, () => api, [api]);

    return <div ref={containerRef} id={elementId} className={className} style={computedStyle} />;
  },
);

NeoChessBoard.displayName = 'NeoChessBoard';
