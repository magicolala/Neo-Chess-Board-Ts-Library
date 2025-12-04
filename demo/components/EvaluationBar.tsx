import React from 'react';
import { useTranslation } from '../i18n/translations';
import styles from './EvaluationBar.module.css';

type Sign = -1 | 0 | 1;
type EvaluationInput = number | string | null | undefined;

export interface ParsedEvaluation {
  hasValue: boolean;
  numeric: number | null;
  label: string;
  mate: boolean;
  sign: Sign;
  raw: EvaluationInput;
}

const formatNumericValue = (value: number): string => {
  if (value === 0) {
    return '0.00';
  }
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
};

const getInfinityLabel = (value: number): string => {
  if (value > 0) return '+∞';
  if (value < 0) return '-∞';
  return '0.00';
};

export const interpretEvaluationValue = (value?: EvaluationInput): ParsedEvaluation => {
  if (value === null || value === undefined) {
    return {
      hasValue: false,
      numeric: null,
      label: '—',
      mate: false,
      sign: 0,
      raw: value ?? null,
    };
  }

  if (typeof value === 'number') {
    const sign = Math.sign(value) as Sign;
    if (!Number.isFinite(value)) {
      return {
        hasValue: true,
        numeric: sign === 0 ? 0 : sign * 100,
        label: getInfinityLabel(value),
        mate: false,
        sign,
        raw: value,
      };
    }

    return {
      hasValue: true,
      numeric: value,
      label: formatNumericValue(value),
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

  if (/^[-+]?#/.test(trimmed)) {
    const negative = trimmed.startsWith('-');
    const positive = trimmed.startsWith('+');
    const sign = negative ? -1 : 1;
    const normalizedLabel = positive ? trimmed.slice(1) : trimmed;

    return {
      hasValue: true,
      numeric: sign * 100,
      label: normalizedLabel,
      mate: true,
      sign: sign as -1 | 1,
      raw: value,
    };
  }

  const parsedNumber = Number.parseFloat(trimmed);
  if (!Number.isNaN(parsedNumber)) {
    const sign = Math.sign(parsedNumber) as Sign;
    if (!Number.isFinite(parsedNumber)) {
      return {
        hasValue: true,
        numeric: sign === 0 ? 0 : sign * 100,
        label: getInfinityLabel(parsedNumber),
        mate: false,
        sign,
        raw: value,
      };
    }

    return {
      hasValue: true,
      numeric: parsedNumber,
      label: formatNumericValue(parsedNumber),
      mate: false,
      sign,
      raw: value,
    };
  }

  return {
    hasValue: true,
    numeric: null,
    label: trimmed,
    mate: false,
    sign: 0,
    raw: value,
  };
};

export interface EvaluationBarProps {
  evaluation?: number | string;
  orientation?: 'white' | 'black';
  ply?: number;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getOrientedValue = (numeric: number | null, isBlackPerspective: boolean): number => {
  if (numeric === null) {
    return 0;
  }
  return isBlackPerspective ? -numeric : numeric;
};

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  orientation = 'white',
  ply = 0,
  className,
}) => {
  const { translate } = useTranslation();
  const parsed = interpretEvaluationValue(evaluation);
  const isBlackPerspective = orientation === 'black';
  const whiteLabel = translate('common.white');
  const blackLabel = translate('common.black');
  const topLabel = isBlackPerspective ? blackLabel : whiteLabel;
  const bottomLabel = isBlackPerspective ? whiteLabel : blackLabel;
  const orientedValue = getOrientedValue(parsed.numeric, isBlackPerspective);
  const fillPercent = parsed.hasValue ? ((clamp(orientedValue, -10, 10) + 10) / 20) * 100 : 50;

  const moveDescriptor = (() => {
    if (ply <= 0) {
      return translate('evaluationBar.ply.start');
    }
    const moveNumber = Math.ceil(ply / 2);
    const isWhiteMove = ply % 2 === 1;
    const suffix = isWhiteMove ? '' : '...';
    const color = isWhiteMove ? whiteLabel : blackLabel;
    return translate('evaluationBar.ply.move', {
      moveNumber: moveNumber.toString(),
      suffix,
      color,
    });
  })();

  const advantageText = (() => {
    if (!parsed.hasValue) {
      return translate('evaluationBar.none');
    }
    if (parsed.mate) {
      return parsed.sign >= 0
        ? translate('evaluationBar.mateWhite')
        : translate('evaluationBar.mateBlack');
    }
    if (parsed.numeric === null) {
      return translate('evaluationBar.custom');
    }
    if (Math.abs(parsed.numeric) < 0.01) {
      return translate('evaluationBar.balanced');
    }
    return parsed.sign > 0
      ? translate('evaluationBar.advantageWhite')
      : translate('evaluationBar.advantageBlack');
  })();

  const containerClassName = className ? `${styles.container} ${className}` : styles.container;
  const scoreClassName = parsed.hasValue ? styles.score : styles.scoreMuted;

  return (
    <div className={containerClassName}>
      <div className={styles.labels} aria-hidden="true">
        <span className={styles.label}>{topLabel}</span>
        <span className={styles.label}>{bottomLabel}</span>
      </div>
      <div className={styles.barWrapper}>
        <div className={styles.barTrack} role="presentation">
          <div className={styles.barFill} style={{ height: `${fillPercent}%` }} />
          <div className={scoreClassName}>{parsed.label}</div>
        </div>
      </div>
      <div className={styles.summary}>
        <span className={styles.summaryPrimary}>{advantageText}</span>
        <span className={styles.summarySecondary}>
          {parsed.hasValue
            ? ply > 0
              ? translate('evaluationBar.afterMove', { move: moveDescriptor })
              : translate('evaluationBar.initial')
            : translate('evaluationBar.importHint')}
        </span>
      </div>
    </div>
  );
};
