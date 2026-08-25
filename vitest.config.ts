import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/engine/**', 'src/stores/**', 'src/lib/**', 'src/pages/**', 'src/components/**'],
      exclude: [
        'src/**/*.test.*',
        'src/test/**',
        // entry-point wiring; exercised by the build, not unit-testable meaningfully
        'src/app/**',
      ],
      thresholds: {
        lines: 85,
        functions: 80,
        statements: 85,
        branches: 75,
      },
    },
  },
})
