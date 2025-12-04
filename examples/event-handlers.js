import { elements } from './dom-elements.js';
import { loadPgn, resetBoard } from './pgn-handling.js';
import { state } from './state.js';
import {
  renderEvaluation,
  renderOrientationStatus,
  renderStatus,
  showStatus,
  updateLanguageToggle,
} from './ui-updaters.js';
import { setOrientation, syncOrientationWithFen } from './board-utils.js';
import { refreshEvaluationForFen } from './evaluation-handling.js';

let board;
let chessRules;
let i18n;

export const initEventHandlers = (boardInstance, chessRulesInstance, i18nInstance) => {
  board = boardInstance;
  chessRules = chessRulesInstance;
  i18n = i18nInstance;

  elements.loadButton.addEventListener('click', () => {
    void loadPgn(elements.pgnTextarea.value, board, chessRules);
  });

  elements.sampleButton.addEventListener('click', async () => {
    try {
      const response = await fetch('./example-game.pgn');
      const text = await response.text();
      elements.pgnTextarea.value = text.trim();
      showStatus('status.info.sampleLoaded', 'info');
    } catch (error) {
      console.error('Error while loading the sample PGN:', error);
      showStatus('status.error.sampleUnavailable', 'error');
    }
  });

  elements.resetButton.addEventListener('click', () => {
    resetBoard(board, chessRules);
  });

  elements.copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(elements.pgnTextarea.value);
      showStatus('status.success.copied', 'success');
    } catch (error) {
      console.error('Error while copying PGN:', error);
      showStatus('status.error.copyFailed', 'error');
    }
  });

  elements.flipButton.addEventListener('click', () => {
    const next = state.orientation === 'white' ? 'black' : 'white';
    state.autoFlip = false;
    elements.autoFlipToggle.checked = false;
    setOrientation(next, board);
    showStatus('status.info.orientationManual', 'info');
  });

  elements.autoFlipToggle.addEventListener('change', () => {
    state.autoFlip = elements.autoFlipToggle.checked;
    if (state.autoFlip) {
      syncOrientationWithFen(chessRules.getFEN(), board);
      showStatus('status.info.autoEnabled', 'info');
    }
  });

  board.on('update', ({ fen }) => {
    syncOrientationWithFen(fen, board);
    refreshEvaluationForFen(fen, chessRules);
    elements.pgnTextarea.value = chessRules.toPgn(false);
  });

  board.on('move', () => {
    const fen = chessRules.getFEN();
    refreshEvaluationForFen(fen, chessRules);
    elements.pgnTextarea.value = chessRules.toPgn(false);
    showStatus('status.info.movePlayed', 'info');
  });

  board.on('illegal', ({ reason }) => {
    showStatus('status.error.illegalMove', 'error', { reason });
  });

  elements.languageToggle.addEventListener('click', () => {
    const nextLanguage = i18n.getLanguage() === 'en' ? 'fr' : 'en';
    i18n.setLanguage(nextLanguage);
    updateLanguageToggle();
    renderOrientationStatus();
    renderEvaluation();
    renderStatus();
  });
};
