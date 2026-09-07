import { useState, type ReactNode } from 'react';
import { Bug, Cable, Focus, Ghost, RotateCcw, Scissors } from 'lucide-react';
import type { CameraPreset, ExplodeGroup, ViewerDebug } from '@/types';
import { useViewerStore } from '@/store';
import { cn } from '@/utils/cn';

/**
 * Controls float over the stage rather than taking a rail of their own: the
 * model is the subject, and every one of these is a view setting you want to
 * judge against what you are looking at.
 */

const CAMERA_PRESETS: { value: CameraPreset; label: string }[] = [
  { value: 'iso', label: 'Iso' },
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
];

const EXPLODE_GROUPS: { value: ExplodeGroup; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'head', label: 'Head' },
  { value: 'body', label: 'Body' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'base', label: 'Base' },
];

const DEBUG_ITEMS: { key: keyof ViewerDebug; label: string }[] = [
  { key: 'grid', label: 'Grid' },
  { key: 'axes', label: 'Axes' },
  { key: 'wireframe', label: 'Wireframe' },
  { key: 'boundingBox', label: 'Bounding box' },
  { key: 'normals', label: 'Normals' },
  { key: 'stats', label: 'Stats' },
];

export function ViewerToolbar() {
  const [debugOpen, setDebugOpen] = useState(false);

  const cameraPreset = useViewerStore((s) => s.cameraPreset);
  const setCameraPreset = useViewerStore((s) => s.setCameraPreset);
  const requestFit = useViewerStore((s) => s.requestFit);

  const explode = useViewerStore((s) => s.explode);
  const setExplode = useViewerStore((s) => s.setExplode);
  const explodeGroup = useViewerStore((s) => s.explodeGroup);
  const setExplodeGroup = useViewerStore((s) => s.setExplodeGroup);

  const ghostMode = useViewerStore((s) => s.ghostMode);
  const toggleGhost = useViewerStore((s) => s.toggleGhost);
  const wiringVisible = useViewerStore((s) => s.wiringVisible);
  const toggleWiring = useViewerStore((s) => s.toggleWiring);

  const section = useViewerStore((s) => s.section);
  const setSection = useViewerStore((s) => s.setSection);
  const debug = useViewerStore((s) => s.debug);
  const toggleDebug = useViewerStore((s) => s.toggleDebug);
  const reset = useViewerStore((s) => s.reset);

  return (
    <>
      {/* ----------------------------- camera ----------------------------- */}
      <Floating className="left-3 top-3">
        <Bar>
          {CAMERA_PRESETS.map((preset) => (
            <TextToggle
              key={preset.value}
              active={cameraPreset === preset.value}
              onClick={() => setCameraPreset(preset.value)}
            >
              {preset.label}
            </TextToggle>
          ))}
          <Divider />
          <IconToggle label="Refit the camera" onClick={requestFit}>
            <Focus size={13} />
          </IconToggle>
        </Bar>
      </Floating>

      {/* ------------------------------ modes ----------------------------- */}
      <Floating className="right-3 top-3">
        <div className="flex flex-col items-end gap-2">
          <Bar>
            <IconToggle
              label="Ghost the outer shells"
              active={ghostMode}
              onClick={toggleGhost}
            >
              <Ghost size={13} />
            </IconToggle>
            <IconToggle label="Show the wiring runs" active={wiringVisible} onClick={toggleWiring}>
              <Cable size={13} />
            </IconToggle>
            <IconToggle
              label="Cut a section through the robot"
              active={section.enabled}
              onClick={() => setSection({ enabled: !section.enabled })}
            >
              <Scissors size={13} />
            </IconToggle>
            <Divider />
            <IconToggle label="Debug overlays" active={debugOpen} onClick={() => setDebugOpen((v) => !v)}>
              <Bug size={13} />
            </IconToggle>
            <IconToggle label="Reset the view" onClick={reset}>
              <RotateCcw size={13} />
            </IconToggle>
          </Bar>

          {section.enabled && (
            <Panel>
              <Row label="Axis">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <TextToggle
                    key={axis}
                    active={section.axis === axis}
                    onClick={() => setSection({ axis })}
                  >
                    {axis.toUpperCase()}
                  </TextToggle>
                ))}
                <Divider />
                <TextToggle active={section.flip} onClick={() => setSection({ flip: !section.flip })}>
                  Flip
                </TextToggle>
              </Row>
              <label className="mt-2 block">
                <span className="mb-1 flex items-baseline justify-between">
                  <span className="text-2xs text-ink-lo">Position</span>
                  <span className="data text-2xs text-ink-mid">
                    {section[section.axis].toFixed(2)}
                  </span>
                </span>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={section[section.axis]}
                  onChange={(e) => setSection({ [section.axis]: Number(e.target.value) })}
                  className={rangeClass}
                />
              </label>
            </Panel>
          )}

          {debugOpen && (
            <Panel>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {DEBUG_ITEMS.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center gap-1.5 text-2xs text-ink-mid hover:text-ink-hi"
                  >
                    <input
                      type="checkbox"
                      checked={debug[item.key]}
                      onChange={() => toggleDebug(item.key)}
                      className="size-3 accent-signal"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </Floating>

      {/* ----------------------------- explode ---------------------------- */}
      <Floating className="bottom-3 left-3">
        <Panel className="w-68">
          <label className="block">
            <span className="mb-1.5 flex items-baseline justify-between">
              <span className="text-2xs text-ink-lo">Explode</span>
              <span className="data text-2xs text-ink-mid">{Math.round(explode * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explode}
              onChange={(e) => setExplode(Number(e.target.value))}
              className={rangeClass}
            />
          </label>

          <div className="mt-2 flex flex-wrap gap-1">
            {EXPLODE_GROUPS.map((group) => (
              <TextToggle
                key={group.value}
                active={explodeGroup === group.value}
                onClick={() => setExplodeGroup(group.value)}
              >
                {group.label}
              </TextToggle>
            ))}
          </div>
        </Panel>
      </Floating>
    </>
  );
}

/* ------------------------------- fragments ------------------------------ */

const rangeClass = cn(
  'h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-mochi',
  '[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-mochi',
  '[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0',
  '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-mochi',
);

function Floating({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('pointer-events-none absolute z-10', className)}>{children}</div>;
}

function Bar({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-panel border border-line bg-surface-1/85 p-1 backdrop-blur">
      {children}
    </div>
  );
}

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'pointer-events-auto rounded-panel border border-line bg-surface-1/85 p-2.5 backdrop-blur',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-2xs text-ink-lo">{label}</span>
      {children}
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />;
}

function TextToggle({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-6 rounded px-1.5 text-2xs transition-colors',
        active ? 'bg-surface-3 text-ink-hi' : 'text-ink-mid hover:bg-surface-2 hover:text-ink-hi',
      )}
    >
      {children}
    </button>
  );
}

function IconToggle({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'grid size-6 place-items-center rounded transition-colors',
        active ? 'bg-surface-3 text-mochi' : 'text-ink-mid hover:bg-surface-2 hover:text-ink-hi',
      )}
    >
      {children}
    </button>
  );
}
