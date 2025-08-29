import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        react: resolve(__dirname, 'src/react/index.ts')
      },
      name: 'NeoChessBoard',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'chess.js'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        exports: 'named'
      }
    },
    sourcemap: true,
    minify: 'terser'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
