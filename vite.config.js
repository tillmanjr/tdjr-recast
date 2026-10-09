import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  build: { target: 'esnext' },
  test: {
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/main.js', 'src/utilities/_template.js'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
