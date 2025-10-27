import React, { useState, useCallback, useMemo } from 'react';
import { NeoChessBoard } from '../../src/react';
import type { Theme } from '../../src/core/types';
import { THEMES, registerTheme } from '../../src/core/themes';
import styles from '../App.module.css';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

// Utility functions for color conversion
const rgbaToHex = (rgba: string): string => {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return '#000000';

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const hexToRgba = (hex: string, alpha: number = 1): string => {
  const match = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return hex;

  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);

  if (alpha === 1) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const extractAlphaFromRgba = (rgba: string): number => {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  return match && match[4] ? parseFloat(match[4]) : 1;
};

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange, description }) => {
  const isRgba = value.startsWith('rgba(');
  const alpha = isRgba ? extractAlphaFromRgba(value) : 1;
  const hexValue = isRgba ? rgbaToHex(value) : value;

  const handleColorPickerChange = (hexColor: string) => {
    if (isRgba) {
      // Convert hex back to RGBA with original alpha
      onChange(hexToRgba(hexColor, alpha));
    } else {
      onChange(hexColor);
    }
  };

  return (
    <div className={styles.colorInput}>
      <label className={styles.colorLabel}>
        <span>{label}</span>
        {description && <small className={styles.colorDescription}>{description}</small>}
      </label>
      <div className={styles.colorControls}>
        <input
          type="color"
          value={hexValue}
          onChange={(e) => handleColorPickerChange(e.target.value)}
          className={styles.colorPicker}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.colorText}
          placeholder="#000000 or rgba(0,0,0,0.5)"
        />
        <div className={styles.colorSwatch} style={{ backgroundColor: value }} title={value} />
      </div>
    </div>
  );
};

export const ThemeCreator: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => ({ ...THEMES.classic }));
  const [themeName, setThemeName] = useState('');
  const [savedThemes, setSavedThemes] = useState<Record<string, Theme>>({ ...THEMES });

  const themeProperties = useMemo(
    () => [
      {
        key: 'light' as keyof Theme,
        label: 'Light Squares',
        desc: 'Background color for light squares',
      },
      {
        key: 'dark' as keyof Theme,
        label: 'Dark Squares',
        desc: 'Background color for dark squares',
      },
      {
        key: 'boardBorder' as keyof Theme,
        label: 'Board Border',
        desc: 'Outer border around the board',
      },
      {
        key: 'whitePiece' as keyof Theme,
        label: 'White Pieces',
        desc: 'Fill color for white pieces',
      },
      {
        key: 'blackPiece' as keyof Theme,
        label: 'Black Pieces',
        desc: 'Fill color for black pieces',
      },
      {
        key: 'pieceShadow' as keyof Theme,
        label: 'Piece Shadow',
        desc: 'Drop shadow under pieces',
      },
      {
        key: 'pieceStroke' as keyof Theme,
        label: 'Piece Stroke',
        desc: 'Outline color for pieces (optional)',
      },
      {
        key: 'pieceHighlight' as keyof Theme,
        label: 'Piece Highlight',
        desc: 'Highlight overlay on pieces (optional)',
      },
      {
        key: 'moveFrom' as keyof Theme,
        label: 'Move From',
        desc: 'Highlight for move origin square',
      },
      {
        key: 'moveTo' as keyof Theme,
        label: 'Move To',
        desc: 'Highlight for destination/legal moves',
      },
      { key: 'lastMove' as keyof Theme, label: 'Last Move', desc: 'Overlay for most recent move' },
      {
        key: 'premove' as keyof Theme,
        label: 'Premoves',
        desc: 'Highlight for premove indicators',
      },
      {
        key: 'check' as keyof Theme,
        label: 'Check Highlight',
        desc: 'Overlay applied when a king is in check',
      },
      {
        key: 'checkmate' as keyof Theme,
        label: 'Checkmate Highlight',
        desc: 'Overlay applied when a player is checkmated',
      },
      {
        key: 'stalemate' as keyof Theme,
        label: 'Stalemate Highlight',
        desc: 'Board tint used when the game reaches stalemate',
      },
      {
        key: 'dot' as keyof Theme,
        label: 'Legal Move Dots',
        desc: 'Small circles for legal moves',
      },
      { key: 'arrow' as keyof Theme, label: 'Arrows', desc: 'Default color for arrows' },
      {
        key: 'squareNameColor' as keyof Theme,
        label: 'Square Names',
        desc: 'Color for coordinate labels',
      },
    ],
    [],
  );

  const updateThemeProperty = useCallback((key: keyof Theme, value: string) => {
    setCurrentTheme((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const loadTheme = useCallback(
    (themeName: string) => {
      const theme = savedThemes[themeName];
      if (theme) {
        setCurrentTheme({ ...theme });
        setThemeName(themeName);
      }
    },
    [savedThemes],
  );

  const saveTheme = useCallback(() => {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    const normalized = registerTheme(themeName, currentTheme);
    setSavedThemes((prev) => ({
      ...prev,
      [themeName]: normalized,
    }));
    alert(`Theme "${themeName}" saved successfully!`);
  }, [themeName, currentTheme]);

  const exportTheme = useCallback(() => {
    const themeJson = JSON.stringify(currentTheme, null, 2);
    const codeSnippet = `import { registerTheme } from '@magicolala/neo-chess-board';

const ${themeName || 'myTheme'} = ${themeJson};

registerTheme('${themeName || 'myTheme'}', ${themeName || 'myTheme'});
`;

    // Create download links
    const jsonBlob = new Blob([themeJson], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `${themeName || 'theme'}.json`;
    jsonLink.click();

    const codeBlob = new Blob([codeSnippet], { type: 'text/plain' });
    const codeUrl = URL.createObjectURL(codeBlob);
    const codeLink = document.createElement('a');
    codeLink.href = codeUrl;
    codeLink.download = `${themeName || 'theme'}.ts`;
    codeLink.click();

    URL.revokeObjectURL(jsonUrl);
    URL.revokeObjectURL(codeUrl);
  }, [currentTheme, themeName]);

  const resetTheme = useCallback(() => {
    setCurrentTheme({ ...THEMES.classic });
    setThemeName('');
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  return (
    <div className={styles.themeCreator}>
      <div className={styles.creatorHeader}>
        <h1 className={styles.creatorTitle}>Neo Chess Board Theme Creator</h1>
        <p className={styles.creatorSubtitle}>
          Create custom themes for your chess board with live preview
        </p>
      </div>

      <div className={styles.creatorLayout}>
        <div className={styles.creatorControls}>
          <div className={styles.controlSection}>
            <h3 className={styles.sectionTitle}>Theme Management</h3>
            <div className={styles.managementControls}>
              <select
                value={themeName}
                onChange={(e) => loadTheme(e.target.value)}
                className={styles.themeSelect}
              >
                <option value="">Select a theme...</option>
                {Object.keys(savedThemes).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Theme name"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className={styles.themeNameInput}
              />
              <button onClick={saveTheme} className={`${styles.button} ${styles.buttonPrimary}`}>
                Save Theme
              </button>
              <button onClick={exportTheme} className={`${styles.button} ${styles.buttonSuccess}`}>
                Export Theme
              </button>
              <button onClick={resetTheme} className={`${styles.button} ${styles.buttonWarning}`}>
                Reset
              </button>
            </div>
          </div>

          <div className={styles.controlSection}>
            <h3 className={styles.sectionTitle}>Colors</h3>
            <div className={styles.colorGrid}>
              {themeProperties.map(({ key, label, desc }) => (
                <ColorInput
                  key={key}
                  label={label}
                  value={currentTheme[key] || ''}
                  onChange={(value) => updateThemeProperty(key, value)}
                  description={desc}
                />
              ))}
            </div>
          </div>

          <div className={styles.controlSection}>
            <h3 className={styles.sectionTitle}>Export Code</h3>
            <div className={styles.codeSection}>
              <pre className={styles.codeBlock}>
                {`const ${themeName || 'myTheme'} = ${JSON.stringify(currentTheme, null, 2)};

registerTheme('${themeName || 'myTheme'}', ${themeName || 'myTheme'});`}
              </pre>
              <button
                onClick={() =>
                  copyToClipboard(
                    `const ${themeName || 'myTheme'} = ${JSON.stringify(currentTheme, null, 2)};\n\nregisterTheme('${themeName || 'myTheme'}', ${themeName || 'myTheme'});`,
                  )
                }
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>

        <div className={styles.creatorPreview}>
          <div className={styles.previewHeader}>
            <h3 className={styles.sectionTitle}>Live Preview</h3>
            <div className={styles.previewInfo}>
              <span>Theme: {themeName || 'Custom'}</span>
            </div>
          </div>
          <div className={styles.boardWrapper}>
            <NeoChessBoard
              theme={currentTheme}
              showSquareNames={true}
              highlightLegal={true}
              style={{
                width: 'min(70vmin, 500px)',
                aspectRatio: '1/1',
                border: '2px solid #ccc',
                borderRadius: '8px',
              }}
            />
          </div>
          <div className={styles.previewActions}>
            <button
              onClick={() => copyToClipboard(JSON.stringify(currentTheme, null, 2))}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Copy JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
