import React from 'react';

const SvgIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className ?? 'h-5 w-5'}
  >
    {children}
  </svg>
);

export const ArrowsIcon: React.FC = () => (
  <SvgIcon>
    <path d="M5 7h8" />
    <path d="m13 7-2-2" />
    <path d="m13 7-2 2" />
    <path d="M19 17h-8" />
    <path d="m11 17 2-2" />
    <path d="m11 17 2 2" />
  </SvgIcon>
);

export const HighlightIcon: React.FC = () => (
  <SvgIcon>
    <path d="m12 6.4 1.7 3.3 3.6 .5-2.7 2.6.6 3.6L12 15.8l-3.2 1.6.6-3.6-2.7-2.6 3.6-.5z" />
  </SvgIcon>
);

export const PremovesIcon: React.FC = () => (
  <SvgIcon>
    <path d="m6 8 4 4-4 4" />
    <path d="m12 8 4 4-4 4" />
  </SvgIcon>
);

export const AnimationIcon: React.FC = () => (
  <SvgIcon>
    <path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.3" />
    <path d="M19.5 12a7.5 7.5 0 0 1-12.6 5.3" />
    <path d="M15.5 5.5v3h3" />
    <path d="M8.5 18.5v-3h-3" />
  </SvgIcon>
);

export const SquareNamesIcon: React.FC = () => (
  <SvgIcon>
    <rect x={4.5} y={4.5} width={15} height={15} rx={2} />
    <path d="M9.5 4.5v15" />
    <path d="M14.5 4.5v15" />
    <path d="M4.5 9.5h15" />
    <path d="M4.5 14.5h15" />
  </SvgIcon>
);

export const SoundIcon: React.FC = () => (
  <SvgIcon>
    <path d="M5.5 10v4h2.8L12 15.7V8.3L8.3 10z" />
    <path d="M15 9.5a2.5 2.5 0 0 1 0 5" />
    <path d="M17.5 8a5 5 0 0 1 0 8" />
  </SvgIcon>
);

export const LegalMovesIcon: React.FC = () => (
  <SvgIcon>
    <circle cx={12} cy={12} r={6} />
    <circle cx={12} cy={12} r={2.6} />
    <path d="M12 6v2" />
    <path d="M12 16v2" />
    <path d="M6 12h2" />
    <path d="M16 12h2" />
  </SvgIcon>
);

export const AutoFlipIcon: React.FC = () => (
  <SvgIcon>
    <path d="M8 7a6 6 0 0 1 9 2" />
    <path d="M17 5v4h-4" />
    <path d="M16 17a6 6 0 0 1-9-2" />
    <path d="M7 19v-4h4" />
  </SvgIcon>
);

export const OrientationIcon: React.FC = () => (
  <SvgIcon>
    <rect x={4.5} y={4.5} width={15} height={15} rx={2} />
    <path d="m9 9 3 3-3 3" />
    <path d="m15 9-3 3 3 3" />
  </SvgIcon>
);

export const BoardSizeIcon: React.FC = () => (
  <SvgIcon>
    <rect x={4.5} y={4.5} width={15} height={15} rx={2} />
    <path d="M8 16h8" />
    <path d="M16 8v8" />
    <path d="m8 8 2 2" />
    <path d="m8 8 2-2" />
  </SvgIcon>
);

export const AddArrowIcon: React.FC = () => (
  <SvgIcon>
    <path d="M5 16h8" />
    <path d="m13 16-2-2" />
    <path d="m13 16-2 2" />
    <path d="M17 7v4" />
    <path d="M15 9h4" />
  </SvgIcon>
);

export const AddHighlightIcon: React.FC = () => (
  <SvgIcon>
    <path d="m12 6.4 1.7 3.3 3.6 .5-2.7 2.6.6 3.6L12 15.8l-3.2 1.6.6-3.6-2.7-2.6 3.6-.5z" />
    <path d="M19 6v4" />
    <path d="M17 8h4" />
  </SvgIcon>
);

export const TrashIcon: React.FC = () => (
  <SvgIcon>
    <path d="M10 5h4" />
    <path d="M6 7h12" />
    <path d="M9 7v10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V7" />
    <path d="M10.5 11v6" />
    <path d="M13.5 11v6" />
  </SvgIcon>
);

export const RewindIcon: React.FC = () => (
  <SvgIcon>
    <path d="M19 18 9 12l10-6v12Z" />
    <path d="M11 18 5 12l6-6v12Z" />
  </SvgIcon>
);

export const StepBackIcon: React.FC = () => (
  <SvgIcon>
    <path d="m15 18-8-6 8-6v12Z" />
    <path d="M7 6v12" />
  </SvgIcon>
);

export const StepForwardIcon: React.FC = () => (
  <SvgIcon>
    <path d="m9 6 8 6-8 6V6Z" />
    <path d="M17 6v12" />
  </SvgIcon>
);

export const FastForwardIcon: React.FC = () => (
  <SvgIcon>
    <path d="M5 18 15 12 5 6v12Z" />
    <path d="M13 18l6-6-6-6v12Z" />
  </SvgIcon>
);

export const PlayIcon: React.FC = () => (
  <SvgIcon>
    <path d="m8 5 11 7-11 7V5Z" />
  </SvgIcon>
);

export const PauseIcon: React.FC = () => (
  <SvgIcon>
    <path d="M9 5h2v14H9z" />
    <path d="M13 5h2v14h-2z" />
  </SvgIcon>
);
