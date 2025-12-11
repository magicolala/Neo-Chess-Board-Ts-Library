import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PuzzleModeDemo } from './src/features/puzzle-mode';
import './styles/global.css';

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('Unable to find #root element to mount demo');
}

const isPuzzleModeRoute =
  globalThis.window !== undefined && globalThis.location.pathname.endsWith('/puzzle-mode');

createRoot(rootElement).render(isPuzzleModeRoute ? <PuzzleModeDemo /> : <App />);
