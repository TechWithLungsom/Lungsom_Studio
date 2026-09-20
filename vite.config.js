import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: { outDir: '../build', emptyOutDir: true },
  server: { watch: { usePolling: true, interval: 500 }, port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:3001' } },
});
