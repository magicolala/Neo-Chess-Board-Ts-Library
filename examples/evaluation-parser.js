import {
  formatInfinityLabel,
  formatNumber,
  getEvaluationSign,
  parseMateValue,
  parseNumericValue,
} from './temp-utils.js';

const EMPTY_LABEL = '—';

const buildResult = ({ hasValue = true, numeric = null, label, mate = false, sign = 0, raw }) => ({
  hasValue,
  numeric,
  label,
  mate,
  sign,
  raw,
});

const buildNoValue = (raw) =>
  buildResult({
    hasValue: false,
    numeric: null,
    label: EMPTY_LABEL,
    mate: false,
    sign: 0,
    raw,
  });

const handleNumberEvaluation = (value) => {
  const sign = getEvaluationSign(value);

  if (!Number.isFinite(value)) {
    return buildResult({
      numeric: sign === 0 ? 0 : sign * 100,
      label: formatInfinityLabel(value),
      mate: false,
      sign,
      raw: value,
    });
  }

  return buildResult({
    numeric: value,
    label: formatNumber(value),
    mate: false,
    sign,
    raw: value,
  });
};

const handleStringEvaluation = (value) => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return buildNoValue(value);
  }

  const mateResult = parseMateValue(trimmed);
  if (mateResult) {
    return mateResult;
  }

  const numericResult = parseNumericValue(trimmed);
  if (numericResult) {
    return numericResult;
  }

  return buildResult({
    numeric: null,
    label: trimmed,
    mate: false,
    sign: getEvaluationSign(trimmed),
    raw: value,
  });
};

export const interpretEvaluationValue = (value) => {
  if (value === null || value === undefined) {
    return buildNoValue(null);
  }

  if (typeof value === 'number') {
    return handleNumberEvaluation(value);
  }

  const normalizedValue = typeof value === 'string' ? value : String(value);
  return handleStringEvaluation(normalizedValue);
};
