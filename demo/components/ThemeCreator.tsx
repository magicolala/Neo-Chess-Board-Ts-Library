import React, { useState, useCallback, useMemo } from 'react';
import { NeoChessBoard } from '../../src/react';
import type { Theme } from '../../src/core/types';
import { THEMES, registerTheme } from '../../src/core/themes';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

// Utility functions for color conversion
const rgbaToHex = (rgba: string): string => {
  const match = rgba.match(/rgba?(d+),s*(d+),s*(d+)(?:,s*([d.]+))?/);
  if (!match) return '#000000';

  const r = Number.parseInt(match[1], 10);
  const g = Number.parseInt(match[2], 10);
  const b = Number.parseInt(match[3], 10);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const hexToRgba = (hex: string, alpha: number = 1): string => {
  const match = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return hex;

  const r = Number.parseInt(match[1], 16);
  const g = Number.parseInt(match[2], 16);
  const b = Number.parseInt(match[3], 16);

  if (alpha === 1) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const extractAlphaFromRgba = (rgba: string): number => {
  const match = rgba.match(/rgba?(d+),s*(d+),s*(d+)(?:,s*([d.]+))?/);
  return match && match[4] ? Number.parseFloat(match[4]) : 1;
};

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange, description }) => {
  const isRgba = value.startsWith('rgba(');
  const alpha = isRgba ? extractAlphaFromRgba(value) : 1;
  const hexValue = isRgba ? rgbaToHex(value) : value;

  const handleColorPickerChange = (hexColor: string) => {
    if (isRgba) {
      onChange(hexToRgba(hexColor, alpha));
    } else {
      onChange(hexColor);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700/50">
      <label className="flex flex-col">
        <span className="text-gray-200 font-medium text-sm">{label}</span>
        {description && <small className="text-xs text-gray-500">{description}</small>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => handleColorPickerChange(e.target.value)}
          className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm w-48 text-gray-200 focus:ring-purple-500 focus:border-purple-500"
          placeholder="#000000 or rgba(0,0,0,0.5)"
        />
        <div
          className="w-6 h-6 rounded border border-gray-600"
          style={{ backgroundColor: value }}
          title={value}
        />
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
    setCurrentTheme((prev) => ({ ...prev, [key]: value }));
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
    setSavedThemes((prev) => ({ ...prev, [themeName]: normalized }));
    alert(`Theme "${themeName}" saved successfully!`);
  }, [themeName, currentTheme]);

  const exportTheme = useCallback(() => {
    const themeJson = JSON.stringify(currentTheme, null, 2);
    const codeSnippet = `import { registerTheme } from '@magicolala/neo-chess-board';\n\nconst ${themeName || 'myTheme'} = ${themeJson};\n\nregisterTheme('${themeName || 'myTheme'}', ${themeName || 'myTheme'});`;
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
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  const buttonClass = 'px-4 py-2 rounded-md font-medium transition text-white';

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <div className="text-center py-8 bg-gray-800/70 border-b border-gray-700">
        <h1 className="text-4xl font-bold text-white">Neo Chess Board Theme Creator</h1>
        <p className="text-lg text-gray-400 mt-2">
          Create custom themes for your chess board with live preview
        </p>
      </div>

      <div className="grid lg:grid-cols-[500px_1fr] gap-8 p-8 max-w-screen-2xl mx-auto">
        <div className="space-y-6">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Theme Management</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={themeName}
                onChange={(e) => loadTheme(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white sm:col-span-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a theme to load...</option>
                {Object.keys(savedThemes).map((name) => (
                  <option key={name} value={name} className="text-black">
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Enter new theme name..."
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white sm:col-span-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={saveTheme}
                className={`${buttonClass} bg-purple-600 hover:bg-purple-700`}
              >
                Save Theme
              </button>
              <button
                onClick={exportTheme}
                className={`${buttonClass} bg-green-600 hover:bg-green-700`}
              >
                Export Theme
              </button>
              <button
                onClick={resetTheme}
                className={`${buttonClass} bg-yellow-600 hover:bg-yellow-700 col-span-2`}
              >
                Reset to Classic
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Colors</h3>
            <div className="grid grid-cols-1 gap-2">
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

          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Export Code</h3>
            <div className="space-y-2">
              <pre className="bg-gray-900 p-4 rounded-md text-sm overflow-x-auto text-gray-200 font-mono">
                {`const ${themeName || 'myTheme'} = ${JSON.stringify(currentTheme, null, 2)};\n\nregisterTheme('${themeName || 'myTheme'}', ${themeName || 'myTheme'});`}
              </pre>
              <button
                onClick={() =>
                  copyToClipboard(
                    `const ${themeName || 'myTheme'} = ${JSON.stringify(currentTheme, null, 2)};\n\nregisterTheme('${themeName || 'myTheme'}', ${themeName || 'myTheme'});`,
                  )
                }
                className={`${buttonClass} bg-gray-600 hover:bg-gray-500 w-full`}
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 sticky top-8">
          <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white">Live Preview</h3>
            <div className="text-sm text-gray-400">
              <span>Theme: {themeName || 'Custom'}</span>
            </div>
          </div>
          <div className="flex justify-center items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <NeoChessBoard
              theme={currentTheme}
              showSquareNames={true}
              highlightLegal={true}
              style={{
                width: 'min(70vmin, 500px)',
                aspectRatio: '1/1',
              }}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => copyToClipboard(JSON.stringify(currentTheme, null, 2))}
              className={`${buttonClass} bg-gray-600 hover:bg-gray-500`}
            >
              Copy JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
