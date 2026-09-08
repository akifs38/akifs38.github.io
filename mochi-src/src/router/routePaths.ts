/**
 * Every path the router answers.
 *
 * The build emits a directory index for each one, so a deep link resolves as a
 * real file instead of leaning on an SPA fallback. GitHub Pages serves only the
 * site root's 404.html — a nested mochi-robot-studio/404.html is never used —
 * so /mochi-robot-studio/robot would otherwise be a hard 404 on reload or when
 * the link is opened directly.
 *
 * Assets are referenced from an absolute base, so an index served from a
 * subdirectory still loads them; React Router reads the real pathname and
 * lands on the right screen.
 */
export const ROUTE_PATHS = [
  '/',
  '/robot',
  '/components',
  '/electronics',
  '/firmware',
  '/behavior',
  '/control',
  '/serial',
  '/sensors',
  '/diagnostics',
  '/assets',
  '/settings',
] as const;
