import { elements } from './dom-elements.js';
import { showStatus } from './ui-updaters.js';
import {
  applyEvaluationsFromRules,
  clearEvaluations,
  refreshEvaluationForFen,
} from './evaluation-handling.js';
import { setOrientation, syncOrientationWithFen } from './board-utils.js';

export const loadPgn = async (pgn, board, chessRules) => {
  const trimmed = pgn.trim();
  if (!trimmed) {
    showStatus('status.error.emptyPgn', 'error');
    return;
  }

  try {
    const success = chessRules.loadPgn(trimmed);
    const boardResult = board.loadPgnWithAnnotations(trimmed);

    if (!success) {
      showStatus('status.error.unableToLoad', 'error');
      return;
    }

    if (boardResult === false) {
      console.warn('Loading PGN annotations on the board failed.');
    }

    applyEvaluationsFromRules(chessRules);
    const updatedFen = chessRules.getFEN();
    board.setPosition(updatedFen, true);
    syncOrientationWithFen(updatedFen, board);
    refreshEvaluationForFen(updatedFen, chessRules);
    elements.pgnTextarea.value = chessRules.toPgn(false);
    showStatus('status.success.loaded', 'success');
  } catch (error) {
    console.error('Error while loading PGN:', error);
    showStatus('status.error.generic', 'error');
  }
};

export const resetBoard = (board, chessRules) => {
  chessRules.reset();
  board.setPosition(chessRules.getFEN(), true);
  elements.pgnTextarea.value = chessRules.toPgn(false);
  clearEvaluations(chessRules);
  setOrientation('white', board);
  showStatus('status.info.reset', 'info');
};
