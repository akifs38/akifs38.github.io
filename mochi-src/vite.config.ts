import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { ROUTE_PATHS } from './src/router/routePaths';

/**
 * Static hosts have no rewrite rules, so a direct hit on /components would 404.
 * Two belts, because the cheaper one is not enough on GitHub Pages:
 *
 * 1. A directory index per route. `/robot` becomes `robot/index.html`, a real
 *    file the host serves with a 200. This is what actually makes deep links
 *    work under a user site, where Pages only ever serves the *site root's*
 *    404.html and never a nested one.
 * 2. A copy at 404.html, which still catches unknown paths on hosts that do
 *    honour it, and costs one small file.
 *
 * Assets are referenced from an absolute base, so an index served from a
 * subdirectory loads them fine and React Router reads the real pathname.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    apply: 'build',
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

// A project site lives at https://<user>.github.io/<repo>/, so assets need that
// prefix. The deploy workflow sets BASE_PATH; local builds stay at the root.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173, strictPort: false },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Not 'assets': the app has an /assets route, and the per-route directory
    // indexes below would write into the bundler's own output folder. Keeping
    // the two apart means neither can shadow the other.
    assetsDir: 'static',
    // The /robot chunk carries three and lands near 950 kB, but only for
    // someone who opened the viewer. Warn above that, so a genuine regression
    // in the chunks everyone downloads still shows up.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Keep the framework in one long-lived chunk; route chunks are produced
        // by the lazy() imports in src/router/routes.tsx.
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'vendor';
          }
          // three deliberately gets no chunk of its own. Naming one made the
          // bundler hoist shared React helpers into it, which put a
          // modulepreload for all 900 kB of the renderer in index.html — every
          // visitor paying for a screen most never open. Left alone, it rides
          // inside the lazy /robot chunk and loads only when that route does.
          return undefined;
        },
      },
    },
  },
});
