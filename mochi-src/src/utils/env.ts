export const isSecureContextOk =
  typeof window === 'undefined' ? true : window.isSecureContext || location.hostname === 'localhost';

export function detectBrowser(): 'chromium' | 'firefox' | 'safari' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Edg\/|Chrome\/|Chromium\//.test(ua) && !/OPR\//.test(ua)) return 'chromium';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua)) return 'safari';
  return 'unknown';
}

/** True on the desktop OSes where a USB serial port is even plausible. */
export const isDesktop =
  typeof navigator === 'undefined' ? true : !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
