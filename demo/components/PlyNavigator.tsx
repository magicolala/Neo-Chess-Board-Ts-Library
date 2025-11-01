import React, { useId } from 'react';

interface PlyNavigatorLabels {
  currentMove: string;
  first: string;
  previous: string;
  play: string;
  pause: string;
  next: string;
  last: string;
  speed: string;
}

interface PlyNavigatorAriaLabels {
  first: string;
  previous: string;
  play: string;
  pause: string;
  next: string;
  last: string;
  speed: string;
}

interface PlyNavigatorIcons {
  first: React.ReactNode;
  previous: React.ReactNode;
  play: React.ReactNode;
  pause: React.ReactNode;
  next: React.ReactNode;
  last: React.ReactNode;
}

export interface PlyNavigatorProps {
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  onPlay: () => void;
  onPause: () => void;
  onPlaybackSpeedChange: (value: number) => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  isPlaying: boolean;
  isPlaybackDisabled: boolean;
  moveLabel: string;
  positionLabel: string;
  playbackSpeed: number;
  playbackSpeedDisplay: string;
  playbackSpeedMin: number;
  playbackSpeedMax: number;
  playbackSpeedStep: number;
  labels: PlyNavigatorLabels;
  ariaLabels: PlyNavigatorAriaLabels;
  icons: PlyNavigatorIcons;
}

export const PlyNavigator: React.FC<PlyNavigatorProps> = ({
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onPlay,
  onPause,
  onPlaybackSpeedChange,
  isAtStart,
  isAtEnd,
  isPlaying,
  isPlaybackDisabled,
  moveLabel,
  positionLabel,
  playbackSpeed,
  playbackSpeedDisplay,
  playbackSpeedMin,
  playbackSpeedMax,
  playbackSpeedStep,
  labels,
  ariaLabels,
  icons,
}) => {
  const moveValueClassName = isAtStart ? 'text-gray-400' : 'font-semibold text-gray-100';
  const speedInputId = useId();

  const buttonBaseClass =
    'flex h-10 items-center justify-center rounded-md bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed';

  const handlePlayPauseClick = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const playPauseAriaLabel = isPlaying ? ariaLabels.pause : ariaLabels.play;
  const playPauseLabel = isPlaying ? labels.pause : labels.play;
  const playPauseIcon = isPlaying ? icons.pause : icons.play;

  return (
    <div className="p-3 rounded-lg bg-gray-800/50">
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
      <div className="grid grid-cols-5 gap-1 mt-4">
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
          onClick={handlePlayPauseClick}
          disabled={isPlaybackDisabled}
          aria-label={playPauseAriaLabel}
          aria-pressed={isPlaying}
        >
          {playPauseIcon}
          <span className="sr-only">{playPauseLabel}</span>
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
      <div className="mt-4 flex flex-col gap-2">
        <label className="sr-only" htmlFor={speedInputId}>
          {labels.speed}
        </label>
        <div className="flex items-center gap-3">
          <input
            id={speedInputId}
            type="range"
            min={playbackSpeedMin}
            max={playbackSpeedMax}
            step={playbackSpeedStep}
            value={playbackSpeed}
            onChange={(event) => onPlaybackSpeedChange(Number(event.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
            aria-valuemin={playbackSpeedMin}
            aria-valuemax={playbackSpeedMax}
            aria-valuenow={playbackSpeed}
            aria-valuetext={playbackSpeedDisplay}
            aria-label={ariaLabels.speed}
          />
          <span className="text-xs text-gray-400 w-20 text-right">{playbackSpeedDisplay}</span>
        </div>
      </div>
    </div>
  );
};
