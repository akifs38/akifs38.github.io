import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { ROUTE_PATHS } from './src/app/routePaths';

/**
 * GitHub Pages has no rewrite rules, so opening /elcin/sohbet directly would
 * 404. Two belts: a real directory index per route (served with a 200 even on
 * a user site, which only ever honours the *root* 404.html), plus a copy at
 * 404.html for hosts that do fall back.
 */
function spaFallback() {
  return {
    name: 'elcin-spa-fallback',
    apply: 'build' as const,
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      const index = resolve(dist, 'index.html');
      if (!existsSync(index)) return;

      const html = readFileSync(index, 'utf8');
      copyFileSync(index, resolve(dist, '404.html'));

      for (const route of ROUTE_PATHS) {
        if (route === '/') continue;
        const dir = resolve(dist, route.replace(/^\//, ''));
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'index.html'), html);
      }
    },
  };
}

// Elçin is served from https://akifs38.github.io/elcin/ in production; the CI
// workflow sets BASE_PATH. Local dev and preview stay at the root.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5273, strictPort: false },
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsDir: 'static',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'vendor';
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
            return 'motion';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
