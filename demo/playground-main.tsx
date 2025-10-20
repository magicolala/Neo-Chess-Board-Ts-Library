import React from 'react';
import { createRoot } from 'react-dom/client';
import { Playground } from './src/pages/Playground';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Playground />
  </React.StrictMode>,
);
