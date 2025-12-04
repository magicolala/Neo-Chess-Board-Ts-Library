import { elements } from './dom-elements.js';
import { state } from './state.js';

let i18n;

export const seti18n = (i18nInstance) => {
  i18n = i18nInstance;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const formatPlyDescriptor = (ply) => {
  if (ply <= 0) {
    return i18n.translate('evaluation.ply.start');
  }
  const moveNumber = Math.ceil(ply / 2);
  const isWhiteMove = ply % 2 === 1;
  return i18n.translate('evaluation.ply.move', {
    moveNumber,
    color: i18n.translate(isWhiteMove ? 'common.white' : 'common.black'),
  });
};

export const renderStatus = () => {
  if (!state.statusState.key) {
    elements.statusMessage.textContent = '';
    delete elements.statusMessage.dataset.state;
    return;
  }
  elements.statusMessage.textContent = i18n.translate(
    state.statusState.key,
    state.statusState.replacements,
  );
  elements.statusMessage.dataset.state = state.statusState.type;
};

export const showStatus = (key, type = 'info', replacements) => {
  state.statusState.key = key;
  state.statusState.type = type;
  state.statusState.replacements = replacements;
  renderStatus();
};

export const updateLanguageToggle = () => {
  const key = i18n.getLanguage() === 'en' ? 'language.toggle.fr' : 'language.toggle.en';
  elements.languageToggle.textContent = i18n.translate(key);
};

export const renderOrientationStatus = () => {
  elements.orientationStatus.textContent = i18n.translate('orientation.status', {
    side: i18n.translate(state.orientation === 'white' ? 'common.white' : 'common.black'),
  });
};

const getOrientedValue = (evaluation, orientation) => {
  if (!evaluation?.hasValue) {
    return null;
  }
  const numeric = evaluation.numeric ?? 0;
  return orientation === 'black' ? numeric * -1 : numeric;
};

const getFillPercentFromValue = (value) => {
  if (value === null) {
    return 50;
  }
  const clamped = clamp(value, -10, 10);
  return ((clamped + 10) / 20) * 100;
};

const getEvalLabels = (orientation) => {
  const isBlackPerspective = orientation === 'black';
  return {
    top: i18n.translate(isBlackPerspective ? 'common.black' : 'common.white'),
    bottom: i18n.translate(isBlackPerspective ? 'common.white' : 'common.black'),
  };
};

const getPrimarySummaryKey = (parsed) => {
  if (!parsed?.hasValue) {
    return 'evaluation.summary.primary.none';
  }

  if (parsed.mate) {
    return parsed.sign >= 0
      ? 'evaluation.summary.primary.mateWhite'
      : 'evaluation.summary.primary.mateBlack';
  }

  if (parsed.numeric === null) {
    return 'evaluation.summary.primary.custom';
  }

  if (Math.abs(parsed.numeric) < 0.01) {
    return 'evaluation.summary.primary.balanced';
  }

  return parsed.sign > 0
    ? 'evaluation.summary.primary.advantageWhite'
    : 'evaluation.summary.primary.advantageBlack';
};

const getSecondarySummary = (parsed, currentPly) => {
  if (!parsed?.hasValue) {
    return {
      value: i18n.translate('evaluation.summary.secondary.instructions'),
      useHtml: true,
    };
  }

  if (currentPly > 0) {
    return {
      value: i18n.translate('evaluation.summary.secondary.afterMove', {
        descriptor: formatPlyDescriptor(currentPly),
      }),
      useHtml: false,
    };
  }

  return {
    value: i18n.translate('evaluation.summary.secondary.initial'),
    useHtml: false,
  };
};

export const renderEvaluation = () => {
  const parsed = state.currentEvaluation;
  const orientedValue = getOrientedValue(parsed, state.orientation);
  const fillPercent = getFillPercentFromValue(orientedValue);

  elements.evalFill.style.height = `${fillPercent}%`;
  elements.evalScore.textContent = parsed?.label ?? 'ƒ?"';
  elements.evalBar.setAttribute('aria-valuenow', String(parsed?.numeric ?? 0));

  const labels = getEvalLabels(state.orientation);
  elements.evalTopLabel.textContent = labels.top;
  elements.evalBottomLabel.textContent = labels.bottom;

  const primaryKey = getPrimarySummaryKey(parsed);
  elements.evalSummaryPrimary.textContent = i18n.translate(primaryKey);
  const secondary = getSecondarySummary(parsed, state.currentPly);
  if (secondary.useHtml) {
    elements.evalSummarySecondary.innerHTML = secondary.value;
  } else {
    elements.evalSummarySecondary.textContent = secondary.value;
  }
};
