import type { ReactNode } from 'react';
import { Button } from './Button';

/**
 * Stands in for a screen that has not been built yet. It names the phase and
 * what will land, instead of showing a mock-up that implies working software.
 */
export function PhaseNotice({
  phase,
  title,
  summary,
  bullets,
  action,
}: {
  phase: number;
  title: string;
  summary: string;
  bullets?: string[];
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md">
        <p className="data text-2xs text-mochi-dim">Phase {phase}</p>
        <h2 className="mt-1.5 text-lg font-medium text-ink-hi">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-mid">{summary}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-l border-line pl-4">
            {bullets.map((bullet) => (
              <li key={bullet} className="text-xs text-ink-lo">
                {bullet}
              </li>
            ))}
          </ul>
        )}
        {action && (
          <Button className="mt-5" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
      <p className="text-sm text-ink-mid">{title}</p>
      {children && <div className="text-xs text-ink-lo">{children}</div>}
    </div>
  );
}
