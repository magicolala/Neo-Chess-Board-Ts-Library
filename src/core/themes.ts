import type { Theme } from './types';

export const THEMES: Record<string, Theme> = {
  classic: {
    light: '#EBEDF0',
    dark: '#B3C0CE',
    boardBorder: '#0F172A0F',
    whitePiece: '#9ca3af',
    blackPiece: '#0f172a',
    pieceShadow: 'rgba(0,0,0,0.15)',
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
    moveFrom: 'rgba(250,204,21,0.4)',
    moveTo: 'rgba(34,197,94,0.35)',
    lastMove: 'rgba(59,130,246,0.3)',
    premove: 'rgba(147,51,234,0.30)',
    dot: 'rgba(255,255,255,0.35)',
    arrow: 'rgba(59,130,246,0.9)',
    squareNameColor: '#E6E8EC',
  },
};

export type ThemeName = keyof typeof THEMES;
