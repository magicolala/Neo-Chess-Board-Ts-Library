import React from 'react';
import styles from '../App.module.css';

interface PlyNavigatorLabels {
  first: string;
  previous: string;
  next: string;
  last: string;
  currentMove: string;
}

interface PlyNavigatorAriaLabels {
  first: string;
  previous: string;
  next: string;
  last: string;
}

export interface PlyNavigatorProps {
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  moveLabel: string;
  positionLabel: string;
  labels: PlyNavigatorLabels;
  ariaLabels: PlyNavigatorAriaLabels;
}

export const PlyNavigator: React.FC<PlyNavigatorProps> = ({
  onFirst,
  onPrevious,
  onNext,
  onLast,
  isAtStart,
  isAtEnd,
  moveLabel,
  positionLabel,
  labels,
  ariaLabels,
}) => {
  const moveValueClassName = isAtStart ? styles.timelineMoveValue : styles.timelineMoveValueActive;

  return (
    <div className={styles.timelineNavigator}>
      <div className={styles.timelineMove}>
        <span className={styles.timelineMoveLabel}>{labels.currentMove}</span>
        <span className={moveValueClassName} aria-live="polite">
          {moveLabel}
        </span>
      </div>
      <div className={styles.timelineDescriptor} aria-live="polite">
        {positionLabel}
      </div>
      <div className={styles.timelineControls}>
        <button
          type="button"
          className={styles.timelineButton}
          onClick={onFirst}
          disabled={isAtStart}
          aria-label={ariaLabels.first}
        >
          {labels.first}
        </button>
        <button
          type="button"
          className={styles.timelineButton}
          onClick={onPrevious}
          disabled={isAtStart}
          aria-label={ariaLabels.previous}
        >
          {labels.previous}
        </button>
        <button
          type="button"
          className={styles.timelineButton}
          onClick={onNext}
          disabled={isAtEnd}
          aria-label={ariaLabels.next}
        >
          {labels.next}
        </button>
        <button
          type="button"
          className={styles.timelineButton}
          onClick={onLast}
          disabled={isAtEnd}
          aria-label={ariaLabels.last}
        >
          {labels.last}
        </button>
      </div>
    </div>
  );
};
