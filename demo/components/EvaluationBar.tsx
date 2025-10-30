import React from 'react';
import { useTranslation } from '../i18n/translations';
import styles from './EvaluationBar.module.css';

type Sign = -1 | 0 | 1;

export interface ParsedEvaluation {
  hasValue: boolean;
  numeric: number | null;
  label: string;
  mate: boolean;
  sign: Sign;
  raw: number | string | null | undefined;
}

export const interpretEvaluationValue = (value?: number | string | null): ParsedEvaluation => {
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
    if (!Number.isFinite(value)) {
      const sign = value > 0 ? 1 : value < 0 ? -1 : 0;
      return {
        hasValue: true,
        numeric: sign === 0 ? 0 : sign * 100,
        label: value > 0 ? '+∞' : value < 0 ? '-∞' : '0.00',
        mate: false,
        sign: sign as -1 | 0 | 1,
        raw: value,
      };
    }

    const sign = value === 0 ? 0 : value > 0 ? 1 : -1;
    const formatted = value === 0 ? '0.00' : value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    return {
      hasValue: true,
      numeric: value,
      label: formatted,
      mate: false,
      sign: sign as -1 | 0 | 1,
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
    if (!Number.isFinite(parsedNumber)) {
      const sign = parsedNumber > 0 ? 1 : parsedNumber < 0 ? -1 : 0;
      const label = parsedNumber > 0 ? '+∞' : parsedNumber < 0 ? '-∞' : '0.00';
      return {
        hasValue: true,
        numeric: sign === 0 ? 0 : sign * 100,
        label,
        mate: false,
        sign: sign as -1 | 0 | 1,
        raw: value,
      };
    }

    const sign = parsedNumber === 0 ? 0 : parsedNumber > 0 ? 1 : -1;
    const formatted =
      parsedNumber === 0
        ? '0.00'
        : parsedNumber > 0
          ? `+${parsedNumber.toFixed(2)}`
          : parsedNumber.toFixed(2);

    return {
      hasValue: true,
      numeric: parsedNumber,
      label: formatted,
      mate: false,
      sign: sign as -1 | 0 | 1,
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
  const orientedValue =
    parsed.numeric === null ? 0 : isBlackPerspective ? -parsed.numeric : parsed.numeric;
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
