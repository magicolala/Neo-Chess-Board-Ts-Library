import React from 'react';
import { IconFirst, IconLast, IconNext, IconPrevious } from '../shared/icons/TimelineIcons';

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
  const moveValueClassName = isAtStart ? 'text-gray-400' : 'font-semibold text-gray-100';

  const buttonBaseClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700/60 text-gray-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 hover:bg-gray-600/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700/60';

  return (
    <div className="p-2 rounded-lg bg-gray-800/50">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {labels.currentMove}
        </span>
        <span className={`${moveValueClassName} transition-colors`} aria-live="polite">
          {moveLabel}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-1" aria-live="polite">
        {positionLabel}
      </div>
      <div className="grid grid-cols-4 gap-1 mt-3">
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onFirst}
          disabled={isAtStart}
          aria-label={ariaLabels.first}
          title={labels.first}
        >
          <IconFirst />
          <span className="sr-only">{labels.first}</span>
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onPrevious}
          disabled={isAtStart}
          aria-label={ariaLabels.previous}
          title={labels.previous}
        >
          <IconPrevious />
          <span className="sr-only">{labels.previous}</span>
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onNext}
          disabled={isAtEnd}
          aria-label={ariaLabels.next}
          title={labels.next}
        >
          <IconNext />
          <span className="sr-only">{labels.next}</span>
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onLast}
          disabled={isAtEnd}
          aria-label={ariaLabels.last}
          title={labels.last}
        >
          <IconLast />
          <span className="sr-only">{labels.last}</span>
        </button>
      </div>
    </div>
  );
};
