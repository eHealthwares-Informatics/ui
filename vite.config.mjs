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
    // Fallbacks are relative paths — same-origin via nginx proxy. Never localhost
    // or absolute hosts: a production build missing env vars must not ping the
    // cashier's own machine or trip mixed-content blocking.
    __IDENTITY_API_URL__: JSON.stringify(process.env.VITE_IDENTITY_API_URL || '/api/identity'),
    __EMR_API_URL__: JSON.stringify(process.env.VITE_EMR_API_URL || '/api/emr'),
    __COMMUNICATION_API_URL__: JSON.stringify(process.env.VITE_COMMUNICATION_API_URL || '/api/communication'),
    __LIS_API_URL__: JSON.stringify(process.env.VITE_LIS_API_URL || '/api/lis'),
    __RXSOFT_API_URL__: JSON.stringify(process.env.VITE_RXSOFT_API_URL || '/api'),
  },
  build: {
    minify: false,
    sourcemap: false
  },
  server: {
    allowedHosts: ['kyung-unexempted-brunilda.ngrok-free.dev']
  }
});
