import { cn } from '@/utils/cn';

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  suffix,
  disabled,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  suffix?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-baseline justify-between">
          <span className="text-2xs text-ink-lo">{label}</span>
          <span className="data text-xs text-ink-mid">
            {value}
            {suffix}
          </span>
        </span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-mochi',
          'disabled:cursor-not-allowed disabled:opacity-40',
          '[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-mochi',
          '[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-mochi',
        )}
      />
    </label>
  );
}
