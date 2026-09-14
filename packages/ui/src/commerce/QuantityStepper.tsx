import { Button } from '../primitives/Button.js';

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
  inputLabel,
  disabled = false,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  inputLabel: string;
  disabled?: boolean;
}) {
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        variant="secondary"
        size="sm"
        aria-label={decreaseLabel}
        disabled={disabled || atMin}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </Button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={inputLabel}
        className="border-beige bg-ivory h-9 w-14 rounded-md border text-center text-body font-semibold text-ink disabled:bg-soft-green"
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(next)) return;
          const ceiling = max === undefined ? next : Math.min(max, next);
          onChange(Math.max(min, ceiling));
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        aria-label={increaseLabel}
        disabled={disabled || atMax}
        onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
      >
        +
      </Button>
    </div>
  );
}
