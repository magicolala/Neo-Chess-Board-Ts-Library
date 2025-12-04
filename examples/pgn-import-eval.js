import { setupI18n } from './i18n.js';
import { elements } from './dom-elements.js';
import { initEventHandlers } from './event-handlers.js';
import { resetBoard } from './pgn-handling.js';
import { seti18n, updateLanguageToggle } from './ui-updaters.js';
import { NeoChessBoard, ChessJsRules } from '../index.js';

const i18n = setupI18n('pgnEval');
seti18n(i18n);

const chessRules = new ChessJsRules();
const board = new NeoChessBoard(elements.boardContainer, {
  interactive: true,
  showCoordinates: true,
  highlightLegal: true,
  showArrows: true,
  showHighlights: true,
  animationMs: 250,
  rulesAdapter: chessRules,
  theme: 'midnight',
});

initEventHandlers(board, chessRules, i18n);

updateLanguageToggle();
resetBoard(board, chessRules);
