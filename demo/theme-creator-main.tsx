import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeCreator } from './components/ThemeCreator';
import './App.module.css';

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <ThemeCreator />
  </React.StrictMode>,
);
