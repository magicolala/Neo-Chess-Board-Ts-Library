import type { Theme } from './types';

export const THEMES: Record<string, Theme> = {
  classic: {
    light: '#2a3547',
    dark: '#57728e',
    boardBorder: '#0F172A0F',
    whitePiece: '#e2d4cb',
    blackPiece: '#171616',
    pieceShadow: 'rgba(0,0,0,0.15)',
    pieceStroke: 'rgba(15,23,42,0.6)',
    pieceHighlight: 'rgba(255,255,255,0.55)',
    moveFrom: 'rgba(250,204,21,0.55)',
    moveTo: 'rgba(34,197,94,0.45)',
    lastMove: 'rgba(59,130,246,0.35)',
    premove: 'rgba(147,51,234,0.35)',
    dot: 'rgba(2,6,23,0.35)',
    arrow: 'rgba(34,197,94,0.9)',
    squareNameColor: '#0F172A',
  },
  midnight: {
    light: '#2A2F3A',
    dark: '#1F242E',
    boardBorder: '#00000026',
    whitePiece: '#E6E8EC',
    blackPiece: '#111418',
    pieceShadow: 'rgba(0,0,0,0.25)',
    pieceStroke: 'rgba(0,0,0,0.65)',
    pieceHighlight: 'rgba(255,255,255,0.4)',
    moveFrom: 'rgba(250,204,21,0.4)',
    moveTo: 'rgba(34,197,94,0.35)',
    lastMove: 'rgba(59,130,246,0.3)',
    premove: 'rgba(147,51,234,0.30)',
    dot: 'rgba(255,255,255,0.35)',
    arrow: 'rgba(59,130,246,0.9)',
    squareNameColor: '#E6E8EC',
  },
};

const DEFAULT_THEME_KEY = 'classic' as const;

const getDefaultTheme = () => THEMES[DEFAULT_THEME_KEY];

const normalizeTheme = (theme: Theme): Theme => {
  const base = getDefaultTheme();
  return {
    ...base,
    ...theme,
    pieceStroke: theme.pieceStroke ?? base.pieceStroke,
    pieceHighlight: theme.pieceHighlight ?? base.pieceHighlight,
  };
};

export type ThemeName = keyof typeof THEMES;
export type CustomThemeName = ThemeName | (string & {});

export const registerTheme = (name: string, theme: Theme): Theme => {
  const normalized = normalizeTheme(theme);
  THEMES[name] = normalized;
  return normalized;
};

export const resolveTheme = (theme: ThemeName | Theme): Theme => {
  if (typeof theme === 'string') {
    return THEMES[theme] ?? getDefaultTheme();
  }
  return normalizeTheme(theme);
};
