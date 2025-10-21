import React from 'react';
import type { PlaygroundThemeMetadata } from '../themes/customThemes';
import type { PlaygroundPieceSetMetadata } from '../pieces';

export interface AppearancePanelProps {
  themes: PlaygroundThemeMetadata[];
  selectedTheme: string;
  onSelectTheme: (id: string) => void;
  pieceSets: PlaygroundPieceSetMetadata[];
  selectedPieceSetId: string;
  onSelectPieceSet: (id: string) => void;
  fallbackNote?: string;
}

const panelStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.85rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
};

const sectionHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: 'var(--playground-text)',
};

const galleryStyles: React.CSSProperties = {
  display: 'grid',
  gap: '0.65rem',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
};

const cardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: '0.55rem',
  padding: '0.65rem',
  borderRadius: '0.75rem',
  border: '1px solid transparent',
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  color: 'var(--playground-text)',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
  cursor: 'pointer',
  textAlign: 'left',
};

const cardActiveStyles: React.CSSProperties = {
  borderColor: 'rgba(96, 165, 250, 0.9)',
  boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.35)',
};

const cardNameStyles: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.9rem',
};

const themeSwatchStyles: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  height: '48px',
  overflow: 'hidden',
  borderRadius: '0.65rem',
  border: '1px solid rgba(148, 163, 184, 0.3)',
};

const swatchColorStyles: React.CSSProperties = {
  flex: '1 1 0',
};

const pieceThumbnailStyles: React.CSSProperties = {
  width: '100%',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '0.6rem',
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
};

const fallbackNoteStyles: React.CSSProperties = {
  margin: 0,
  marginTop: '0.25rem',
  fontSize: '0.75rem',
  color: 'var(--playground-muted)',
  lineHeight: 1.4,
};

const AppearancePanel: React.FC<AppearancePanelProps> = ({
  themes,
  selectedTheme,
  onSelectTheme,
  pieceSets,
  selectedPieceSetId,
  onSelectPieceSet,
  fallbackNote,
}) => {
  return (
    <section style={panelStyles} aria-label="Appearance options">
      <header style={sectionHeaderStyles}>
        <span style={{ fontWeight: 600 }}>Theme</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--playground-muted)' }}>
          Choose a color palette.
        </span>
      </header>
      <div style={galleryStyles}>
        {themes.map((theme) => {
          const isActive = theme.id === selectedTheme;
          return (
            <button
              key={theme.id}
              type="button"
              style={{
                ...cardStyles,
                ...(isActive ? cardActiveStyles : {}),
              }}
              onClick={() => onSelectTheme(theme.id)}
              aria-pressed={isActive}
            >
              <div style={themeSwatchStyles}>
                {theme.previewColors.map((color, index) => (
                  <div
                    key={`${theme.id}-${color}-${index}`}
                    style={{ ...swatchColorStyles, backgroundColor: color }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span style={cardNameStyles}>{theme.label}</span>
            </button>
          );
        })}
      </div>

      <header style={{ ...sectionHeaderStyles, marginTop: '0.25rem' }}>
        <span style={{ fontWeight: 600 }}>Pieces</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--playground-muted)' }}>
          Swap the artwork.
        </span>
      </header>
      <div style={galleryStyles}>
        {pieceSets.map((pieceSet) => {
          const isActive = pieceSet.id === selectedPieceSetId;
          return (
            <button
              key={pieceSet.id}
              type="button"
              style={{
                ...cardStyles,
                ...(isActive ? cardActiveStyles : {}),
              }}
              onClick={() => onSelectPieceSet(pieceSet.id)}
              aria-pressed={isActive}
            >
              <img
                src={pieceSet.thumbnail}
                alt={pieceSet.label}
                loading="lazy"
                decoding="async"
                style={pieceThumbnailStyles}
              />
              <span style={cardNameStyles}>{pieceSet.label}</span>
            </button>
          );
        })}
      </div>
      {fallbackNote ? <p style={fallbackNoteStyles}>{fallbackNote}</p> : null}
    </section>
  );
};

export default AppearancePanel;
