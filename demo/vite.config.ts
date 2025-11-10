import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isVercelDeployment = Boolean(process.env.VERCEL);

export default defineConfig({
  base: isVercelDeployment ? '/' : '/Neo-Chess-Board-Ts-Library/demo/',
  plugins: [react()],
  build: {
    outDir: '../dist/demo', // Output to dist/demo relative to the project root
    rollupOptions: {
      input: {
        main: './index.html',
        themeCreator: './theme-creator.html',
        playground: './playground.html',
      },
    },
  },
});
