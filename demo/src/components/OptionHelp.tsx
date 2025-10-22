import React from 'react';

export interface OptionHelpProps {
  href: string;
  label: string;
}

const linkStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.5rem',
  height: '1.5rem',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.45)',
  color: 'var(--playground-muted)',
  backgroundColor: 'rgba(15, 23, 42, 0.75)',
  fontSize: '0.75rem',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease',
};

const OptionHelp: React.FC<OptionHelpProps> = ({ href, label }) => {
  const stopPropagation = (event: React.SyntheticEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      style={linkStyles}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <span aria-hidden="true">i</span>
    </a>
  );
};

export default OptionHelp;
