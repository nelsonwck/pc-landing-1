import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import imageCompressPlugin from './vite-plugin-image-compress.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    imageCompressPlugin({
      maxWidth: 2560,
      jpegQuality: 80,
      pngQuality: 80,
      verbose: true,
    }),
  ],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
      output: {
        manualChunks: undefined,
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "./variables" as *;`,
      },
    },
  },
  server: {
    open: false,
    port: 3000,
  },
});
