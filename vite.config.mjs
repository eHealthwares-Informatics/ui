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
    // e2e/**/*.test.ts IS a vitest test (harness unit tests, e.g. provision.test.ts).
    exclude: ['**/node_modules/**', 'e2e/**/*.spec.ts', 'playwright/**', 'dist/**'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'e2e/**/*.test.ts'],
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
    minify: true,
    sourcemap: false
  },
  server: {
    allowedHosts: ['kyung-unexempted-brunilda.ngrok-free.dev'],
    watch: {
      // Playwright writes its artifacts *while the dev server is running*
      // (`webServer.command: 'yarn dev --host'` shares the vite process with the
      // run). Every artifact write fired a full HMR page reload on connected
      // clients, killing in-flight navigations — see ui#94. The html reporter
      // `outputFolder` (e2e/reports) is the loud one: it streams report data
      // during the run and `removeFolders()` + rebuilds the whole tree in
      // `onEnd`, which is a burst of add/unlink events mid-suite.
      //
      // Patterns are chokidar globs matched against absolute paths. Vite 8 also
      // ignores **/.git/**, **/node_modules/**, **/test-results/**, cacheDir and
      // build.outDir by default; they are listed here so the whole exclusion set
      // is explicit and survives a config merge / downgrade.
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/e2e/reports/**',
        '**/test-results/**',
        '**/playwright-report/**',
      ],
    },
  }
});
