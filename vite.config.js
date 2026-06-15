/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Only under Vitest (whose bundled Vite uses esbuild and does not apply the
  // plugin-react automatic JSX transform) enable the automatic JSX runtime so
  // test files can render JSX without importing React. Vite 8's oxc build
  // transformer ignores this key, so gating it avoids a build-time warning.
  ...(process.env.VITEST ? { esbuild: { jsx: 'automatic' } } : {}),
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
