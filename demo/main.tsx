import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PuzzleModeDemoPlaceholder } from './src/features/puzzle-mode';
import './styles/global.css';

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('Unable to find #root element to mount demo');
}

const isPuzzleModeRoute =
  typeof window !== 'undefined' && window.location.pathname.endsWith('/puzzle-mode');

createRoot(rootElement).render(isPuzzleModeRoute ? <PuzzleModeDemoPlaceholder /> : <App />);
