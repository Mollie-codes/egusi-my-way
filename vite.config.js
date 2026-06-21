import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 7000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
