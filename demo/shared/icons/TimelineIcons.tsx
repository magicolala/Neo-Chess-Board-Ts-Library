import React from 'react';

const IconBase: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" role="img" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const IconFirst: React.FC = () => (
  <IconBase>
    <rect x="4" y="5" width="2" height="14" />
    <path d="M18 6 10 12l8 6V6z" />
  </IconBase>
);

export const IconPrevious: React.FC = () => (
  <IconBase>
    <path d="M16 6 8 12l8 6V6z" />
  </IconBase>
);

export const IconNext: React.FC = () => (
  <IconBase>
    <path d="M8 6l8 6-8 6V6z" />
  </IconBase>
);

export const IconLast: React.FC = () => (
  <IconBase>
    <path d="M6 6l8 6-8 6V6z" />
    <rect x="18" y="5" width="2" height="14" />
  </IconBase>
);

export const IconPlay: React.FC = () => (
  <IconBase>
    <path d="M8 5l10 7-10 7V5z" />
  </IconBase>
);

export const IconPause: React.FC = () => (
  <IconBase>
    <rect x="7" y="5" width="3" height="14" />
    <rect x="14" y="5" width="3" height="14" />
  </IconBase>
);
