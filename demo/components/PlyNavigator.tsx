import React from 'react';

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
    'px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-md text-sm font-medium text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

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
        >
          {labels.first}
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onPrevious}
          disabled={isAtStart}
          aria-label={ariaLabels.previous}
        >
          {labels.previous}
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onNext}
          disabled={isAtEnd}
          aria-label={ariaLabels.next}
        >
          {labels.next}
        </button>
        <button
          type="button"
          className={buttonBaseClass}
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
