/**
 * Custom hooks pour les différents handlers du Playground
 * Extrait de Playground.tsx pour réduire la complexité cognitive
 */
import type React from 'react';
import { useCallback } from 'react';
import type { ThemeName } from '../state/playgroundStore';
import type { PlaygroundState } from '../state/playgroundStore';
import type { BoardEventMap } from '../../../src/core/types';

export function usePlaygroundHandlers(options: {
  updateBoardOptions: (update: Partial<PlaygroundState>) => void;
  pushLog: (message: string) => void;
  getThemeLabel: (id: ThemeName) => string;
  getPieceSetLabel: (id: string) => string;
}) {
  const { updateBoardOptions, pushLog, getThemeLabel, getPieceSetLabel } = options;

  const handleThemeSelect = useCallback(
    (nextTheme: ThemeName) => {
      updateBoardOptions({ theme: nextTheme });
      pushLog(`Theme changed to ${getThemeLabel(nextTheme)}`);
    },
    [updateBoardOptions, pushLog, getThemeLabel],
  );

  const handlePieceSetSelect = useCallback(
    (nextPieceSetId: string, currentPieceSetId: string) => {
      if (nextPieceSetId === currentPieceSetId) {
        return;
      }
      updateBoardOptions({ pieceSetId: nextPieceSetId });
      const label = getPieceSetLabel(nextPieceSetId);
      pushLog(`Pieces changed to ${label}`);
    },
    [updateBoardOptions, pushLog, getPieceSetLabel],
  );

  const handleShowCoordinatesChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ showCoordinates: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleHighlightLegalChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ highlightLegal: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleInteractiveChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ interactive: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleAutoFlipChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ autoFlip: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleAllowDrawingArrowsChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ allowDrawingArrows: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleAnimationDurationChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const nextValue = Number(event.target.value);
      if (Number.isFinite(nextValue)) {
        updateBoardOptions({ animationDurationInMs: nextValue });
      }
    },
    [updateBoardOptions],
  );

  const handleDragActivationDistanceChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    (event) => {
      const nextValue = Number(event.target.value);
      if (Number.isFinite(nextValue)) {
        updateBoardOptions({ dragActivationDistance: nextValue });
      }
    },
    [updateBoardOptions],
  );

  const handlePromotionUiChange = useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    (event) => {
      const nextUi = event.target.value === 'inline' ? 'inline' : 'dialog';
      updateBoardOptions({ promotionUi: nextUi });
      pushLog(
        `Promotion UI switched to ${nextUi === 'inline' ? 'inline overlay' : 'dialog extension'}.`,
      );
    },
    [updateBoardOptions, pushLog],
  );

  const handleAutoQueenChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const nextValue = event.target.checked;
      updateBoardOptions({ autoQueen: nextValue });
      pushLog(
        nextValue
          ? 'Auto-queen enabled: promotions will resolve to queens automatically.'
          : 'Auto-queen disabled: promotions now require a manual choice.',
      );
    },
    [updateBoardOptions, pushLog],
  );

  return {
    handleThemeSelect,
    handlePieceSetSelect,
    handleShowCoordinatesChange,
    handleHighlightLegalChange,
    handleInteractiveChange,
    handleAutoFlipChange,
    handleAllowDrawingArrowsChange,
    handleAnimationDurationChange,
    handleDragActivationDistanceChange,
    handlePromotionUiChange,
    handleAutoQueenChange,
  };
}

export function useBoardEventHandlers(options: { pushLog: (message: string) => void }) {
  const { pushLog } = options;

  const handleBoardIllegal = useCallback(
    (event: BoardEventMap['illegal']) => {
      pushLog(
        `Illegal move attempted from ${event.from} to ${event.to}: ${event.reason || 'Unknown reason'}`,
      );
    },
    [pushLog],
  );

  const handleBoardUpdate = useCallback(
    (event: BoardEventMap['update']) => {
      pushLog(`Board updated: ${event.fen}`);
    },
    [pushLog],
  );

  return {
    handleBoardIllegal,
    handleBoardUpdate,
  };
}
