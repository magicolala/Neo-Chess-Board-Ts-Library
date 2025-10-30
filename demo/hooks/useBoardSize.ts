import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';

interface BoardSizeConfig {
  defaultSize: number;
  minSize: number;
  maxSize: number;
  step: number;
}

type SizeUpdater = number | ((current: number) => number);

const clampSize = (value: number, config: BoardSizeConfig): number => {
  const { defaultSize, minSize, maxSize, step } = config;

  if (!Number.isFinite(value)) {
    return defaultSize;
  }

  const limited = Math.min(maxSize, Math.max(minSize, value));
  const snappedSteps = Math.round((limited - minSize) / step);
  const snapped = minSize + snappedSteps * step;

  return Math.min(maxSize, Math.max(minSize, snapped));
};

export interface UseBoardSizeResult {
  size: number;
  sizeLabel: string;
  isResizing: boolean;
  containerRef: RefObject<HTMLDivElement>;
  containerStyle: CSSProperties;
  setSize: (value: SizeUpdater) => void;
  resetSize: () => void;
  minSize: number;
  maxSize: number;
  step: number;
  handlePointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  handleKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  handleDoubleClick: () => void;
}

export const useBoardSize = (config: BoardSizeConfig): UseBoardSizeResult => {
  const { defaultSize, minSize, maxSize, step } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const [size, setSizeState] = useState(() =>
    clampSize(defaultSize, { defaultSize, minSize, maxSize, step }),
  );
  const [isResizing, setIsResizing] = useState(false);

  const clampValue = useCallback(
    (rawValue: number) => clampSize(rawValue, { defaultSize, minSize, maxSize, step }),
    [defaultSize, minSize, maxSize, step],
  );

  const setSize = useCallback(
    (valueOrUpdater: SizeUpdater) => {
      setSizeState((previous) => {
        const rawValue =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (current: number) => number)(previous)
            : valueOrUpdater;
        const nextValue = clampValue(rawValue);
        return nextValue === previous ? previous : nextValue;
      });
    },
    [clampValue],
  );

  const resetSize = useCallback(() => {
    setSize(defaultSize);
  }, [defaultSize, setSize]);

  const applyPointerPosition = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const desiredSize = Math.max(offsetX, offsetY);

      setSize(desiredSize);
    },
    [setSize],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!containerRef.current) {
        return;
      }

      activePointerRef.current = event.pointerId;
      setIsResizing(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      applyPointerPosition(event);
    },
    [applyPointerPosition],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (activePointerRef.current !== event.pointerId) {
        return;
      }

      event.preventDefault();
      applyPointerPosition(event);
    },
    [applyPointerPosition],
  );

  const finishPointerInteraction = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    activePointerRef.current = null;
    setIsResizing(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    event.preventDefault();
  }, []);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      finishPointerInteraction(event);
    },
    [finishPointerInteraction],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      finishPointerInteraction(event);
    },
    [finishPointerInteraction],
  );

  const handleDoubleClick = useCallback(() => {
    resetSize();
  }, [resetSize]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowRight': {
          event.preventDefault();
          setSize((previous) => previous + step);
          break;
        }
        case 'ArrowDown':
        case 'ArrowLeft': {
          event.preventDefault();
          setSize((previous) => previous - step);
          break;
        }
        case 'Home': {
          event.preventDefault();
          setSize(minSize);
          break;
        }
        case 'End': {
          event.preventDefault();
          setSize(maxSize);
          break;
        }
        case 'Enter':
        case ' ': {
          event.preventDefault();
          resetSize();
          break;
        }
        default: {
          break;
        }
      }
    },
    [maxSize, minSize, resetSize, setSize, step],
  );

  const sizeLabel = useMemo(() => `${size}px`, [size]);

  const containerStyle = useMemo<CSSProperties>(() => {
    const dimension = `${size}px`;
    return {
      width: dimension,
      maxWidth: '100%',
      aspectRatio: '1 / 1',
    };
  }, [size]);

  return {
    size,
    sizeLabel,
    isResizing,
    containerRef,
    containerStyle,
    setSize,
    resetSize,
    minSize,
    maxSize,
    step,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleKeyDown,
    handleDoubleClick,
  };
};
