import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PuzzleModeDemo } from './src/features/puzzle-mode';
import './styles/global.css';

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('Unable to find #root element to mount demo');
}

const isBrowser = typeof globalThis.window !== 'undefined';
const puzzleRouteSuffixes = ['/puzzle-mode', '/puzzle-mode/', '/puzzle-mode.html'];
const currentPath = isBrowser ? globalThis.location.pathname : '';
const isPuzzleModeRoute =
  isBrowser && puzzleRouteSuffixes.some((suffix) => currentPath.endsWith(suffix));

createRoot(rootElement).render(isPuzzleModeRoute ? <PuzzleModeDemo /> : <App />);
