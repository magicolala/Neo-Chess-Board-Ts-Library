import type { Theme } from '../../../src/core/types';
import { registerTheme, resolveTheme } from '../../../src/core/themes';
import type { CustomThemeName } from '../../../src/core/themes';

export interface PlaygroundThemeMetadata {
  id: CustomThemeName;
  label: string;
  previewColors: [string, string, string];
}

const createMetadata = (
  id: CustomThemeName,
  label: string,
  theme: Theme,
): PlaygroundThemeMetadata => ({
  id,
  label,
  previewColors: [theme.light, theme.dark, theme.moveTo],
});

const sandThemeDefinition: Theme = {
  light: '#f2e1c2',
  dark: '#c59b6c',
  boardBorder: 'rgba(133, 88, 44, 0.45)',
  whitePiece: '#f7f2e8',
  blackPiece: '#4b3425',
  pieceShadow: 'rgba(0, 0, 0, 0.2)',
  pieceStroke: 'rgba(87, 56, 32, 0.55)',
  pieceHighlight: 'rgba(255, 255, 255, 0.55)',
  moveFrom: 'rgba(253, 186, 116, 0.55)',
  moveTo: 'rgba(191, 131, 84, 0.45)',
  lastMove: 'rgba(245, 158, 11, 0.4)',
  premove: 'rgba(249, 115, 22, 0.35)',
  dot: 'rgba(30, 19, 11, 0.4)',
  arrow: 'rgba(234, 179, 8, 0.9)',
  squareNameColor: '#3f2e1f',
};

const forestThemeDefinition: Theme = {
  light: '#7fb77e',
  dark: '#264653',
  boardBorder: 'rgba(21, 71, 43, 0.5)',
  whitePiece: '#f1faee',
  blackPiece: '#0b3d2e',
  pieceShadow: 'rgba(0, 0, 0, 0.22)',
  pieceStroke: 'rgba(3, 48, 28, 0.7)',
  pieceHighlight: 'rgba(255, 255, 255, 0.5)',
  moveFrom: 'rgba(129, 199, 132, 0.55)',
  moveTo: 'rgba(56, 161, 105, 0.45)',
  lastMove: 'rgba(59, 130, 246, 0.35)',
  premove: 'rgba(236, 72, 153, 0.3)',
  dot: 'rgba(12, 36, 21, 0.45)',
  arrow: 'rgba(34, 197, 94, 0.95)',
  squareNameColor: '#0d1f14',
};

const neonThemeDefinition: Theme = {
  light: '#22d3ee',
  dark: '#1d1b4b',
  boardBorder: 'rgba(56, 189, 248, 0.35)',
  whitePiece: '#f0f9ff',
  blackPiece: '#0f172a',
  pieceShadow: 'rgba(8, 145, 178, 0.35)',
  pieceStroke: 'rgba(12, 74, 110, 0.7)',
  pieceHighlight: 'rgba(255, 255, 255, 0.6)',
  moveFrom: 'rgba(244, 114, 182, 0.5)',
  moveTo: 'rgba(59, 130, 246, 0.55)',
  lastMove: 'rgba(168, 85, 247, 0.45)',
  premove: 'rgba(34, 211, 238, 0.35)',
  dot: 'rgba(15, 23, 42, 0.45)',
  arrow: 'rgba(236, 72, 153, 0.95)',
  squareNameColor: '#e0f2fe',
};

const sandTheme = registerTheme('sand', sandThemeDefinition);
const forestTheme = registerTheme('forest', forestThemeDefinition);
const neonTheme = registerTheme('neon', neonThemeDefinition);

const baseThemes: PlaygroundThemeMetadata[] = [
  createMetadata('classic', 'Classic', resolveTheme('classic')),
  createMetadata('midnight', 'Midnight', resolveTheme('midnight')),
];

const customThemes: PlaygroundThemeMetadata[] = [
  createMetadata('sand', 'Sandstone', sandTheme),
  createMetadata('forest', 'Forest Canopy', forestTheme),
  createMetadata('neon', 'Neon Nights', neonTheme),
];

export const playgroundThemeMetadata: PlaygroundThemeMetadata[] = [...baseThemes, ...customThemes];
