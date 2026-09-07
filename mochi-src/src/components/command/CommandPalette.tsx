import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store';
import { buildCommands, type Command } from './commands';
import { cn } from '@/utils/cn';

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => (open ? buildCommands(navigate) : []), [open, navigate]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(needle));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const run = (command: Command) => {
    setOpen(false);
    void command.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = results[active];
      if (command) run(command);
    }
  };

  let lastSection = '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[12vh]"
      onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-[34rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line-strong bg-surface-1 shadow-2xl shadow-black/60"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a command…"
          className="h-11 w-full border-b border-line bg-transparent px-4 text-sm text-ink-hi outline-none placeholder:text-ink-lo"
        />

        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-ink-lo">
              Nothing matches “{query}”.
            </p>
          )}

          {results.map((command, index) => {
            const showSection = command.section !== lastSection;
            lastSection = command.section;
            return (
              <div key={command.id}>
                {showSection && (
                  <p className="px-4 pb-1 pt-2.5 text-2xs text-ink-lo">{command.section}</p>
                )}
                <button
                  onMouseEnter={() => setActive(index)}
                  onClick={() => run(command)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-4 py-1.5 text-left text-xs',
                    index === active ? 'bg-surface-2 text-ink-hi' : 'text-ink-mid',
                  )}
                >
                  {command.icon && (
                    <command.icon size={14} strokeWidth={1.75} className="shrink-0 text-ink-lo" />
                  )}
                  <span className="truncate">{command.label}</span>
                  {command.hint && (
                    <span className="ml-auto shrink-0 text-2xs text-ink-lo">{command.hint}</span>
                  )}
                  {command.shortcut && (
                    <kbd className="data ml-auto shrink-0 rounded border border-line px-1 text-2xs text-ink-lo">
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
