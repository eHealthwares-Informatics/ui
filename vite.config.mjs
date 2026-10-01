import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite'


export default defineConfig({
   optimizeDeps: {
    include: [
      'react', 
      'react/jsx-runtime', 
      'react-dom'
    ],
  },
  plugins: [tanstackRouter({
    target: 'react',
    autoCodeSplitting: true,
  }), react(), sentryVitePlugin({
    org: "ehealthwares",
    project: "rxsoft-admin"
  })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
    // Playwright e2e specs are NOT vitest tests — without this exclude vitest
    // picks up e2e/**/*.spec.ts and errors on test.describe() outside its runner.
    exclude: ['**/node_modules/**', 'e2e/**', 'playwright/**', 'dist/**'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },

  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __IDENTITY_API_URL__: JSON.stringify(process.env.VITE_IDENTITY_API_URL || 'http://localhost:8092'),
    __EMR_API_URL__: JSON.stringify(process.env.VITE_EMR_API_URL || 'http://localhost:8093/api'),
    __COMMUNICATION_API_URL__: JSON.stringify(process.env.VITE_COMMUNICATION_API_URL || 'http://localhost:8003/api/v1'),
    __LIS_API_URL__: JSON.stringify(process.env.VITE_LIS_API_URL || 'http://localhost:8002'),
    __RXSOFT_API_URL__: JSON.stringify(process.env.VITE_RXSOFT_API_URL || 'https://rxsoft-backend.onrender.com/api'),
  },
  build: {
    minify: false,
    sourcemap: true
  },
  server: {
    allowedHosts: ['kyung-unexempted-brunilda.ngrok-free.dev']
  }
});
