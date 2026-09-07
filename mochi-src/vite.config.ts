import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';

/**
 * GitHub Pages has no rewrite rules, so a direct hit on /components would 404.
 * Pages serves 404.html for any unmatched path, and because assets are
 * referenced from an absolute base the app boots from there and React Router
 * reads the real pathname. A copy of index.html is all that takes.
 *
 * Hosts with a proper SPA fallback (Netlify, Vercel, Cloudflare Pages) ignore
 * this file, so it is harmless everywhere else.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const index = resolve(__dirname, 'dist/index.html');
      if (existsSync(index)) copyFileSync(index, resolve(__dirname, 'dist/404.html'));
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
