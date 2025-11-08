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

interface PlyNavigatorIcons {
  first: React.ReactNode;
  previous: React.ReactNode;
  next: React.ReactNode;
  last: React.ReactNode;
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
  icons: PlyNavigatorIcons;
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
  icons,
}) => {
  const moveValueClassName = isAtStart ? 'text-gray-400' : 'font-semibold text-gray-100';

  const buttonBaseClass =
    'h-10 w-full bg-gray-700/50 hover:bg-gray-600/50 rounded-md text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

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
          <span className="sr-only">{labels.first}</span>
          {icons.first}
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onPrevious}
          disabled={isAtStart}
          aria-label={ariaLabels.previous}
        >
          <span className="sr-only">{labels.previous}</span>
          {icons.previous}
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onNext}
          disabled={isAtEnd}
          aria-label={ariaLabels.next}
        >
          <span className="sr-only">{labels.next}</span>
          {icons.next}
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onLast}
          disabled={isAtEnd}
          aria-label={ariaLabels.last}
        >
          <span className="sr-only">{labels.last}</span>
          {icons.last}
        </button>
      </div>
    </div>
  );
};
