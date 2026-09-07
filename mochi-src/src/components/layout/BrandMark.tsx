import { useDeviceStore } from '@/store';

/**
 * The robot's own face, used as the studio's mark. Its eyes track the
 * connection state — closed while disconnected, open once the device answers.
 * This is the one place the interface is allowed to be cute.
 */
export function BrandMark() {
  const connected = useDeviceStore((s) => s.state === 'connected');

  return (
    <span className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <rect
          x="2.5"
          y="4.5"
          width="19"
          height="15"
          rx="5"
          fill="var(--color-surface-2)"
          stroke="var(--color-line-strong)"
        />
        {connected ? (
          <>
            <circle cx="9" cy="12" r="1.9" fill="var(--color-mochi)" />
            <circle cx="15" cy="12" r="1.9" fill="var(--color-mochi)" />
          </>
        ) : (
          <>
            <path d="M7.2 12h3.6" stroke="var(--color-ink-lo)" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M13.2 12h3.6" stroke="var(--color-ink-lo)" strokeWidth="1.7" strokeLinecap="round" />
          </>
        )}
      </svg>
      <span className="text-sm font-medium tracking-tight text-ink-hi">Mochi Studio</span>
    </span>
  );
}
