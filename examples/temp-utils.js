export const getEvaluationSign = (value) => {
  if (typeof value === 'number') {
    if (value === 0) {
      return 0;
    }
    return value > 0 ? 1 : -1;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('-')) return -1;
    if (trimmed.startsWith('+')) return 1;
  }
  return 0;
};

export const formatNumber = (num) => {
  if (num === 0) return '0.00';
  return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
};

export const formatInfinityLabel = (value) => {
  if (value > 0) {
    return '+∞';
  }
  if (value < 0) {
    return '-∞';
  }
  return '0.00';
};

export const parseMateValue = (value) => {
  const mateMatch = value.match(/^#(-?\d+)$/);
  if (!mateMatch) return null;

  const mateMoves = Number.parseInt(mateMatch[1], 10);
  if (Number.isNaN(mateMoves)) return null;

  const sign = getEvaluationSign(mateMoves);
  return {
    hasValue: true,
    numeric: sign === 0 ? 0 : sign * 100,
    label: `#${mateMoves}`,
    mate: true,
    sign,
    raw: value,
  };
};

export const parseNumericValue = (value) => {
  const numericMatch = value.match(/^([+-]?\d+(?:\.\d+)?)$/);
  if (!numericMatch) return null;

  const parsedNumber = Number.parseFloat(numericMatch[1]);
  if (Number.isNaN(parsedNumber)) return null;

  const sign = getEvaluationSign(parsedNumber);
  const label = formatNumber(parsedNumber);
  return {
    hasValue: true,
    numeric: parsedNumber,
    label,
    mate: false,
    sign,
    raw: value,
  };
};
