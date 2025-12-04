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

export const renderEvaluation = () => {
  const parsed = state.currentEvaluation;
  const orientedValue = parsed?.hasValue
    ? state.orientation === 'black'
      ? (parsed.numeric ?? 0) * -1
      : parsed.numeric
    : null;
  const fillPercent = parsed?.hasValue
    ? ((clamp(orientedValue ?? 0, -10, 10) + 10) / 20) * 100
    : 50;

  elements.evalFill.style.height = `${fillPercent}%`;
  elements.evalScore.textContent = parsed?.label ?? '—';
  elements.evalBar.setAttribute('aria-valuenow', String(parsed?.numeric ?? 0));

  const isBlackPerspective = state.orientation === 'black';
  elements.evalTopLabel.textContent = i18n.translate(
    isBlackPerspective ? 'common.black' : 'common.white',
  );
  elements.evalBottomLabel.textContent = i18n.translate(
    isBlackPerspective ? 'common.white' : 'common.black',
  );

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
    } else {
      primaryKey =
        parsed.sign > 0
          ? 'evaluation.summary.primary.advantageWhite'
          : 'evaluation.summary.primary.advantageBlack';
    }
  }

  elements.evalSummaryPrimary.textContent = i18n.translate(primaryKey);
  if (!parsed?.hasValue) {
    elements.evalSummarySecondary.innerHTML = i18n.translate(
      'evaluation.summary.secondary.instructions',
    );
  } else if (state.currentPly > 0) {
    elements.evalSummarySecondary.textContent = i18n.translate(
      'evaluation.summary.secondary.afterMove',
      {
        descriptor: formatPlyDescriptor(state.currentPly),
      },
    );
  } else {
    elements.evalSummarySecondary.textContent = i18n.translate(
      'evaluation.summary.secondary.initial',
    );
  }
};
