import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const isVercelDeployment = Boolean(process.env.VERCEL);

export default defineConfig({
  base: isVercelDeployment ? '/' : '/Neo-Chess-Board-Ts-Library/',
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        react: path.resolve(__dirname, 'src/react/index.ts'),
      },
      name: 'NeoChessBoard',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'chess.js'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
