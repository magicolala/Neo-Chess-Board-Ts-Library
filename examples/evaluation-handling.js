import { state } from './state.js';
import { renderEvaluation } from './ui-updaters.js';
import { interpretEvaluationValue } from './evaluation-parser.js';
import { ChessJsRules } from '../index.js';

export const clearEvaluations = (chessRules) => {
  state.evaluationsByPly = {};
  state.fenToPlyMap = {};
  state.currentEvaluation = undefined;
  state.currentPly = chessRules.history().length;
  renderEvaluation();
};

export const refreshEvaluationForFen = (fen, chessRules) => {
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

export const updateEvaluationFromPly = (ply) => {
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
  return !normalizedSetup || normalizedSetup === '1' || normalizedSetup === 'true'
    ? fen
    : undefined;
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

const buildVerboseHistory = (chessRules) =>
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

export const applyEvaluationsFromRules = (chessRules) => {
  const notation = chessRules.getPgnNotation();
  const fenFromMetadata = extractMetadataFen(notation);
  const evaluationMap = collectEvaluationMap(notation);
  const verboseHistory = buildVerboseHistory(chessRules);
  const fenToPlyMap = buildFenToPlyMap(verboseHistory, fenFromMetadata);

  state.evaluationsByPly = evaluationMap;
  state.fenToPlyMap = fenToPlyMap;
  updateEvaluationFromPly(verboseHistory.length);
};

export const syncEvaluationsFromRules = (chessRules) => {
  try {
    applyEvaluationsFromRules(chessRules);
  } catch (error) {
    console.error('Failed to synchronise PGN evaluations:', error);
    clearEvaluations(chessRules);
  }
};
