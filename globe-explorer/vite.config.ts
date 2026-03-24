/// <reference types="vitest/config" />
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          )
            return 'react';
          if (id.includes('node_modules/@tanstack/')) return 'tanstack';
          if (id.includes('node_modules/@base-ui/')) return 'base-ui';
          if (
            id.includes('node_modules/topojson-client/') ||
            id.includes('node_modules/earcut/') ||
            id.includes('node_modules/world-atlas/')
          )
            return 'geo';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
