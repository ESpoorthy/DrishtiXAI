/**
 * ConfidenceBar — model confidence score visualisation.
 *
 * Includes a mandatory contextual note to avoid misleading users into
 * treating model confidence as clinical diagnostic certainty.
 */

interface Props {
  value?:      number | null;   // 0.0 – 1.0
  label?:      string;
  showLabel?:  boolean;
  showNote?:   boolean;         // show clinical context note
  height?:     'sm' | 'md';
}

function confFill(c: number): string {
  if (c >= 0.80) return 'bg-emerald-400';
  if (c >= 0.60) return 'bg-amber-400';
  return 'bg-red-400';
}

function confPct(c?: number | null): string {
  return `${((c ?? 0) * 100).toFixed(1)}%`;
}

export function ConfidenceBar({
  value,
  label     = 'Model confidence',
  showLabel = true,
  showNote  = false,
  height    = 'md',
}: Props) {
  const pct    = (value ?? 0) * 100;
  const fill   = confFill(value ?? 0);
  const hClass = height === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-ink-muted mb-1.5">
          <span>{label}</span>
          <span className="font-bold text-ink">{confPct(value)}</span>
        </div>
      )}
      <div className={`progress-track ${hClass}`}>
        <div className={`progress-fill ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      {showNote && (
        <p className="confidence-note mt-2">
          Model confidence reflects the prediction probability for this image.
          It does not represent clinical diagnostic certainty.
        </p>
      )}
    </div>
  );
}

/** Compact confidence pill badge */
export function ConfidencePill({ value }: { value?: number | null }) {
  const pct = Math.round((value ?? 0) * 100);
  const cls =
    (value ?? 0) >= 0.80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    (value ?? 0) >= 0.60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200';

  return (
    <span className={`badge border ${cls}`}>
      {pct}% confidence
    </span>
  );
}

export { confFill, confPct };
