import React from 'react';
import { createRoot } from 'react-dom/client';
import './src/themes/customThemes';
import { PlaygroundProvider, PlaygroundView, loadPlaygroundStyles } from './src/pages/Playground';

const container = document.querySelector('#root');

if (!container) {
  throw new Error('Playground root element not found');
}

const root = createRoot(container);

await loadPlaygroundStyles();

root.render(
  <React.StrictMode>
    <PlaygroundProvider>
      <PlaygroundView />
    </PlaygroundProvider>
  </React.StrictMode>,
);
