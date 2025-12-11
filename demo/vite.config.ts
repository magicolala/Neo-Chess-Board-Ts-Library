import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Neo-Chess-Board-Ts-Library/demo/',
  plugins: [react()],
  build: {
    outDir: '../dist/demo', // Output to dist/demo relative to the project root
    rollupOptions: {
      input: {
        main: './index.html',
        themeCreator: './theme-creator.html',
        puzzleMode: './puzzle-mode.html',
      },
    },
  },
});
