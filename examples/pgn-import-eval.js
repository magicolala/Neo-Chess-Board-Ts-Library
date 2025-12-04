import { setupI18n } from './i18n.js';
import {
  formatInfinityLabel,
  formatNumber,
  getEvaluationSign,
  parseMateValue,
  parseNumericValue,
} from './temp-utils.js';
import { NeoChessBoard, ChessJsRules } from '../index.js';

const i18n = setupI18n('pgnEval');
const { translate } = i18n;

const languageToggle = document.querySelector('#language-toggle');
const statusMessage = document.querySelector('#pgnStatus');
const boardContainer = document.querySelector('#board');
const pgnTextarea = document.querySelector('#pgnInput');
const loadButton = document.querySelector('#loadPgn');
const sampleButton = document.querySelector('#loadSample');
const resetButton = document.querySelector('#resetBoard');
const copyButton = document.querySelector('#copyPgn');
const flipButton = document.querySelector('#flipBoard');
const autoFlipToggle = document.querySelector('#autoFlip');
const evalBar = document.querySelector('#evaluationBar');
const evalFill = document.querySelector('#evalFill');
const evalScore = document.querySelector('#evalScore');
const evalTopLabel = document.querySelector('#evalTopLabel');
const evalBottomLabel = document.querySelector('#evalBottomLabel');
const evalSummaryPrimary = document.querySelector('#evalSummaryPrimary');
const evalSummarySecondary = document.querySelector('#evalSummarySecondary');
const orientationStatus = document.querySelector('#orientationStatus');

const updateLanguageToggle = () => {
  let key;
  key = i18n.getLanguage() === 'en' ? 'language.toggle.fr' : 'language.toggle.en';
  languageToggle.textContent = translate(key);
};

const statusState = {
  key: null,
  replacements: undefined,
  type: 'info',
};

const state = {
  evaluationsByPly: {},
  fenToPlyMap: {},
  currentPly: 0,
  currentEvaluation: undefined,
  orientation: 'white',
  autoFlip: true,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const interpretEvaluationValue = (value) => {
  if (value === null || value === undefined) {
    return {
      hasValue: false,
      numeric: null,
      label: '—',
      mate: false,
      sign: 0,
      raw: null,
    };
  }

  if (typeof value === 'number') {
    const sign = getEvaluationSign(value);
    if (!Number.isFinite(value)) {
      return {
        hasValue: true,
        numeric: sign === 0 ? 0 : sign * 100,
        label: formatInfinityLabel(value),
        mate: false,
        sign,
        raw: value,
      };
    }

    return {
      hasValue: true,
      numeric: value,
      label: formatNumber(value),
      mate: false,
      sign,
      raw: value,
    };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {
      hasValue: false,
      numeric: null,
      label: '—',
      mate: false,
      sign: 0,
      raw: value,
    };
  }

  const mateResult = parseMateValue(trimmed);
  if (mateResult) {
    return mateResult;
  }

  const numericResult = parseNumericValue(trimmed);
  if (numericResult) {
    return numericResult;
  }

  return {
    hasValue: true,
    numeric: null,
    label: trimmed,
    mate: false,
    sign: getEvaluationSign(trimmed),
    raw: value,
  };
};

const renderStatus = () => {
  if (!statusState.key) {
    statusMessage.textContent = '';
    delete statusMessage.dataset.state;
    return;
  }
  statusMessage.textContent = translate(statusState.key, statusState.replacements);
  statusMessage.dataset.state = statusState.type;
};

const showStatus = (key, type = 'info', replacements) => {
  statusState.key = key;
  statusState.type = type;
  statusState.replacements = replacements;
  renderStatus();
};

const formatPlyDescriptor = (ply) => {
  if (ply <= 0) {
    return translate('evaluation.ply.start');
  }
  const moveNumber = Math.ceil(ply / 2);
  const isWhiteMove = ply % 2 === 1;
  const color = isWhiteMove ? 'common.white' : 'common.black';
  return translate('evaluation.ply.move', {
    moveNumber,
    color: translate(color),
  });
};

const renderOrientationStatus = () => {
  orientationStatus.textContent = translate('orientation.status', {
    side: translate(state.orientation === 'white' ? 'common.white' : 'common.black'),
  });
};

const renderEvaluation = () => {
  const parsed = state.currentEvaluation;
  let orientedValue = null;
  if (parsed?.hasValue) {
    orientedValue = state.orientation === 'black' ? (parsed.numeric ?? 0) * -1 : parsed.numeric;
  }

  let fillPercent = 50;
  if (parsed?.hasValue) {
    fillPercent = ((clamp(orientedValue ?? 0, -10, 10) + 10) / 20) * 100;
  }

  evalFill.style.height = `${fillPercent}%`;
  evalScore.textContent = parsed?.label ?? '—';
  evalBar.setAttribute('aria-valuenow', String(parsed?.numeric ?? 0));

  const isBlackPerspective = state.orientation === 'black';
  if (isBlackPerspective) {
    evalTopLabel.textContent = translate('common.black');
    evalBottomLabel.textContent = translate('common.white');
  } else {
    evalTopLabel.textContent = translate('common.white');
    evalBottomLabel.textContent = translate('common.black');
  }

  let primaryKey = 'evaluation.summary.primary.none';
  if (parsed?.hasValue) {
    if (parsed.mate) {
      primaryKey =
        parsed.sign >= 0
          ? 'evaluation.summary.primary.mateWhite'
          : 'evaluation.summary.primary.mateBlack';
    } else if (parsed.numeric === null) {
      primaryKey = 'evaluation.summary.primary.custom';
    } else if (Math.abs(parsed.numeric) < 0.01) {
      primaryKey = 'evaluation.summary.primary.balanced';
    } else if (parsed.sign > 0) {
      primaryKey = 'evaluation.summary.primary.advantageWhite';
    } else {
      primaryKey = 'evaluation.summary.primary.advantageBlack';
    }
  }

  evalSummaryPrimary.textContent = translate(primaryKey);

  if (!parsed?.hasValue) {
    evalSummarySecondary.innerHTML = translate('evaluation.summary.secondary.instructions');
  } else if (state.currentPly > 0) {
    evalSummarySecondary.textContent = translate('evaluation.summary.secondary.afterMove', {
      descriptor: formatPlyDescriptor(state.currentPly),
    });
  } else {
    evalSummarySecondary.textContent = translate('evaluation.summary.secondary.initial');
  }
};

const clearEvaluations = () => {
  state.evaluationsByPly = {};
  state.fenToPlyMap = {};
  state.currentEvaluation = undefined;
  state.currentPly = chessRules.history().length;
  renderEvaluation();
};

const setOrientation = (orientation) => {
  state.orientation = orientation;
  board.setOrientation(orientation);
  renderOrientationStatus();
  renderEvaluation();
};

const syncOrientationWithFen = (fen) => {
  if (!state.autoFlip) {
    return;
  }
  const sideToMove = fen.split(' ')[1] === 'w' ? 'white' : 'black';
  if (state.orientation !== sideToMove) {
    setOrientation(sideToMove);
  }
};

const refreshEvaluationForFen = (fen) => {
  const mappedPly = state.fenToPlyMap[fen];
  if (typeof mappedPly === 'number') {
    state.currentPly = mappedPly;
    state.currentEvaluation = interpretEvaluationValue(state.evaluationsByPly[mappedPly]);
  } else {
    state.currentPly = chessRules.history().length;
    state.currentEvaluation = undefined;
  }
  renderEvaluation();
};

const updateEvaluationFromPly = (ply) => {
  state.currentPly = ply;
  state.currentEvaluation = interpretEvaluationValue(state.evaluationsByPly[ply]);
  renderEvaluation();
};

const extractMetadataFen = (notation) => {
  const metadata = typeof notation.getMetadata === 'function' ? notation.getMetadata() : undefined;
  const fen = metadata?.FEN?.trim();
  if (!fen) {
    return;
  }
  const normalizedSetup = metadata?.SetUp ? metadata.SetUp.trim().toLowerCase() : undefined;
  if (!normalizedSetup || normalizedSetup === '1' || normalizedSetup === 'true') {
    return fen;
  }
};

const collectEvaluationMap = (notation) => {
  const evaluationMap = {};
  let sequentialPly = 0;

  for (const move of notation.getMovesWithAnnotations()) {
    if (move.evaluation?.white !== undefined) {
      sequentialPly += 1;
      evaluationMap[sequentialPly] = move.evaluation.white;
    }
    if (move.evaluation?.black !== undefined) {
      sequentialPly += 1;
      evaluationMap[sequentialPly] = move.evaluation.black;
    }
  }

  return evaluationMap;
};

const buildVerboseHistory = () =>
  chessRules.getHistory().map((move) => ({
    from: move.from,
    to: move.to,
    promotion: move.promotion,
  }));

const createTimelineRules = (fenFromMetadata) => {
  if (!fenFromMetadata) {
    const fallback = new ChessJsRules();
    fallback.reset();
    return fallback;
  }

  try {
    return new ChessJsRules(fenFromMetadata);
  } catch (error) {
    console.warn('Unable to rebuild PGN timeline with the provided FEN:', error);
    const fallback = new ChessJsRules();
    fallback.reset();
    return fallback;
  }
};

const buildFenToPlyMap = (history, fenFromMetadata) => {
  const timelineRules = createTimelineRules(fenFromMetadata);
  const fenMap = { [timelineRules.getFEN()]: 0 };

  history.forEach((move, index) => {
    const result = timelineRules.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
    if (result.ok) {
      fenMap[timelineRules.getFEN()] = index + 1;
    }
  });

  return fenMap;
};

const applyEvaluationsFromRules = () => {
  const notation = chessRules.getPgnNotation();
  const fenFromMetadata = extractMetadataFen(notation);
  const evaluationMap = collectEvaluationMap(notation);
  const verboseHistory = buildVerboseHistory();
  const fenToPlyMap = buildFenToPlyMap(verboseHistory, fenFromMetadata);

  state.evaluationsByPly = evaluationMap;
  state.fenToPlyMap = fenToPlyMap;
  updateEvaluationFromPly(verboseHistory.length);
};

const syncEvaluationsFromRules = () => {
  try {
    applyEvaluationsFromRules();
  } catch (error) {
    console.error('Failed to synchronise PGN evaluations:', error);
    clearEvaluations();
  }
};

const chessRules = new ChessJsRules();
const board = new NeoChessBoard(boardContainer, {
  interactive: true,
  showCoordinates: true,
  highlightLegal: true,
  showArrows: true,
  showHighlights: true,
  animationMs: 250,
  rulesAdapter: chessRules,
  theme: 'midnight',
});

const loadPgn = async (pgn) => {
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

    syncEvaluationsFromRules();
    const updatedFen = chessRules.getFEN();
    board.setPosition(updatedFen, true);
    syncOrientationWithFen(updatedFen);
    refreshEvaluationForFen(updatedFen);
    pgnTextarea.value = chessRules.toPgn(false);
    showStatus('status.success.loaded', 'success');
  } catch (error) {
    console.error('Error while loading PGN:', error);
    showStatus('status.error.generic', 'error');
  }
};

const resetBoard = () => {
  chessRules.reset();
  board.setPosition(chessRules.getFEN(), true);
  pgnTextarea.value = chessRules.toPgn(false);
  clearEvaluations();
  setOrientation('white');
  showStatus('status.info.reset', 'info');
};

loadButton.addEventListener('click', () => {
  void loadPgn(pgnTextarea.value);
});

sampleButton.addEventListener('click', async () => {
  try {
    const response = await fetch('./example-game.pgn');
    const text = await response.text();
    pgnTextarea.value = text.trim();
    showStatus('status.info.sampleLoaded', 'info');
  } catch (error) {
    console.error('Error while loading the sample PGN:', error);
    showStatus('status.error.sampleUnavailable', 'error');
  }
});

resetButton.addEventListener('click', () => {
  resetBoard();
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(pgnTextarea.value);
    showStatus('status.success.copied', 'success');
  } catch (error) {
    console.error('Error while copying PGN:', error);
    showStatus('status.error.copyFailed', 'error');
  }
});

flipButton.addEventListener('click', () => {
  const next = state.orientation === 'white' ? 'black' : 'white';
  state.autoFlip = false;
  autoFlipToggle.checked = false;
  setOrientation(next);
  showStatus('status.info.orientationManual', 'info');
});

autoFlipToggle.addEventListener('change', () => {
  state.autoFlip = autoFlipToggle.checked;
  if (state.autoFlip) {
    syncOrientationWithFen(chessRules.getFEN());
    showStatus('status.info.autoEnabled', 'info');
  }
});

board.on('update', ({ fen }) => {
  syncOrientationWithFen(fen);
  refreshEvaluationForFen(fen);
  pgnTextarea.value = chessRules.toPgn(false);
});

board.on('move', () => {
  const fen = chessRules.getFEN();
  refreshEvaluationForFen(fen);
  pgnTextarea.value = chessRules.toPgn(false);
  showStatus('status.info.movePlayed', 'info');
});

board.on('illegal', ({ reason }) => {
  showStatus('status.error.illegalMove', 'error', { reason });
});

languageToggle.addEventListener('click', () => {
  const nextLanguage = i18n.getLanguage() === 'en' ? 'fr' : 'en';
  i18n.setLanguage(nextLanguage);
  updateLanguageToggle();
  renderOrientationStatus();
  renderEvaluation();
  renderStatus();
});

updateLanguageToggle();
resetBoard();
