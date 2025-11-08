import React from 'react';

interface PlyNavigatorLabels {
  first: string;
  previous: string;
  next: string;
  last: string;
  play: string;
  pause: string;
  playbackSpeed: string;
  playbackSpeedValue: string;
  currentMove: string;
}

interface PlyNavigatorAriaLabels {
  first: string;
  previous: string;
  next: string;
  last: string;
  play: string;
  pause: string;
  speed: string;
}

interface PlyNavigatorIcons {
  first: React.ReactNode;
  previous: React.ReactNode;
  next: React.ReactNode;
  last: React.ReactNode;
  play: React.ReactNode;
  pause: React.ReactNode;
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
  isAutoPlaying: boolean;
  isAutoplayAvailable: boolean;
  onToggleAutoplay: () => void;
  playbackSpeed: number;
  playbackSpeedInputId: string;
  playbackSpeedMin: number;
  playbackSpeedMax: number;
  playbackSpeedStep: number;
  onPlaybackSpeedChange: React.ChangeEventHandler<HTMLInputElement>;
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
  isAutoPlaying,
  isAutoplayAvailable,
  onToggleAutoplay,
  playbackSpeed,
  playbackSpeedInputId,
  playbackSpeedMin,
  playbackSpeedMax,
  playbackSpeedStep,
  onPlaybackSpeedChange,
}) => {
  const moveValueClassName = isAtStart ? 'text-gray-400' : 'font-semibold text-gray-100';

  const buttonBaseClass =
    'inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-md text-sm font-medium text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const playbackButtonAriaLabel = isAutoPlaying ? ariaLabels.pause : ariaLabels.play;
  const playbackButtonLabel = isAutoPlaying ? labels.pause : labels.play;
  const playbackButtonIcon = isAutoPlaying ? icons.pause : icons.play;

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
          {icons.first}
          <span className="sr-only">{labels.first}</span>
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onPrevious}
          disabled={isAtStart}
          aria-label={ariaLabels.previous}
        >
          {icons.previous}
          <span className="sr-only">{labels.previous}</span>
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onNext}
          disabled={isAtEnd}
          aria-label={ariaLabels.next}
        >
          {icons.next}
          <span className="sr-only">{labels.next}</span>
        </button>
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onLast}
          disabled={isAtEnd}
          aria-label={ariaLabels.last}
        >
          {icons.last}
          <span className="sr-only">{labels.last}</span>
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          className={`${buttonBaseClass} sm:w-28`}
          onClick={onToggleAutoplay}
          disabled={!isAutoplayAvailable && !isAutoPlaying}
          aria-label={playbackButtonAriaLabel}
          aria-pressed={isAutoPlaying}
        >
          {playbackButtonIcon}
          <span className="sr-only">{playbackButtonLabel}</span>
        </button>
        <div className="flex-1 flex items-center gap-3">
          <label htmlFor={playbackSpeedInputId} className="sr-only">
            {labels.playbackSpeed}
          </label>
          <input
            id={playbackSpeedInputId}
            type="range"
            min={playbackSpeedMin}
            max={playbackSpeedMax}
            step={playbackSpeedStep}
            value={playbackSpeed}
            onChange={onPlaybackSpeedChange}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
            aria-valuemin={playbackSpeedMin}
            aria-valuemax={playbackSpeedMax}
            aria-valuenow={playbackSpeed}
            aria-label={ariaLabels.speed}
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {labels.playbackSpeedValue}
          </span>
        </div>
      </div>
    </div>
  );
};