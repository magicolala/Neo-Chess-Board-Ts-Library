import { state } from './state.js';
import { renderEvaluation, renderOrientationStatus } from './ui-updaters.js';

export const setOrientation = (orientation, board) => {
  state.orientation = orientation;
  board.setOrientation(orientation);
  renderOrientationStatus();
  renderEvaluation();
};

export const syncOrientationWithFen = (fen, board) => {
  if (!state.autoFlip) {
    return;
  }
  const sideToMove = fen.split(' ')[1] === 'w' ? 'white' : 'black';
  if (state.orientation !== sideToMove) {
    setOrientation(sideToMove, board);
  }
};
