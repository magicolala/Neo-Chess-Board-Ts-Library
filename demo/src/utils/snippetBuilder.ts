import type { PlaygroundState } from '../state/playgroundStore';
import type { PlaygroundOrientation } from './permalink';

export type SnippetKind = 'react' | 'vanilla' | 'ssr';

export interface PlaygroundSnippetArgs {
  state: PlaygroundState;
  orientation: PlaygroundOrientation;
}

export interface PlaygroundSnippets {
  react: string;
  vanilla: string;
  ssr: string;
}

const formatBoolean = (value: boolean): string => (value ? 'true' : 'false');

const formatReactBooleanProp = (name: string, value: boolean): string =>
  value ? name : `${name}={false}`;

const formatReactNumberProp = (name: string, value: number): string => `${name}={${value}}`;

const formatReactStringProp = (name: string, value: string): string => `${name}="${value}"`;

const buildReactProps = ({ state, orientation }: PlaygroundSnippetArgs): string[] => [
  formatReactStringProp('orientation', orientation),
  formatReactStringProp('theme', state.theme),
  formatReactBooleanProp('showCoordinates', state.showCoordinates),
  formatReactBooleanProp('highlightLegal', state.highlightLegal),
  formatReactBooleanProp('interactive', state.interactive),
  formatReactBooleanProp('autoFlip', state.autoFlip),
  formatReactBooleanProp('allowDrawingArrows', state.allowDrawingArrows),
  formatReactNumberProp('animationDurationInMs', state.animationDurationInMs),
  formatReactNumberProp('dragActivationDistance', state.dragActivationDistance),
];

const buildReactSnippet = (args: PlaygroundSnippetArgs): string => {
  const propLines = buildReactProps(args).map((line) => `      ${line}`);

  return [
    "import { NeoChessBoard } from '@magicolala/neo-chess-board/react';",
    '',
    'export function ExampleBoard(): JSX.Element {',
    '  return (',
    '    <NeoChessBoard',
    ...propLines,
    '    />',
    '  );',
    '}',
    '',
  ].join('\n');
};

const buildVanillaSnippet = ({ state, orientation }: PlaygroundSnippetArgs): string => {
  const optionsLines = [
    `  orientation: '${orientation}',`,
    `  theme: '${state.theme}',`,
    `  showCoordinates: ${formatBoolean(state.showCoordinates)},`,
    `  highlightLegal: ${formatBoolean(state.highlightLegal)},`,
    `  interactive: ${formatBoolean(state.interactive)},`,
    `  autoFlip: ${formatBoolean(state.autoFlip)},`,
    `  allowDrawingArrows: ${formatBoolean(state.allowDrawingArrows)},`,
    `  animationDurationInMs: ${state.animationDurationInMs},`,
    `  dragActivationDistance: ${state.dragActivationDistance},`,
  ];

  return [
    "import { NeoChessBoard } from '@magicolala/neo-chess-board';",
    '',
    "const container = document.getElementById('board');",
    '',
    'if (!container) {',
    "  throw new Error('Board container not found');",
    '}',
    '',
    'const board = new NeoChessBoard(container, {',
    ...optionsLines,
    '});',
    '',
    "board.on('move', ({ from, to }) => {",
    '  console.log(`Move: ${from} → ${to}`);',
    '});',
    '',
  ].join('\n');
};

const buildSsrSnippet = (args: PlaygroundSnippetArgs): string => {
  const propLines = buildReactProps(args).map((line) => `        ${line}`);

  return [
    "import { renderToString } from 'react-dom/server';",
    "import { NeoChessBoard } from '@magicolala/neo-chess-board/react';",
    '',
    'export function renderBoardMarkup(): string {',
    '  return renderToString(',
    '    <NeoChessBoard',
    ...propLines,
    '    />',
    '  );',
    '}',
    '',
  ].join('\n');
};

export const buildPlaygroundSnippets = (args: PlaygroundSnippetArgs): PlaygroundSnippets => ({
  react: buildReactSnippet(args),
  vanilla: buildVanillaSnippet(args),
  ssr: buildSsrSnippet(args),
});
