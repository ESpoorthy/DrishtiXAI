/**
 * Confidence score bar — reusable across screening pages
 */
import { confFill, confPct } from '@/lib/utils';

interface Props {
  value?: number | null;   // 0.0 – 1.0
  label?: string;
  showLabel?: boolean;
  height?: 'sm' | 'md';
}

export function ConfidenceBar({ value, label = 'Confidence', showLabel = true, height = 'md' }: Props) {
  const pct     = (value ?? 0) * 100;
  const fill    = confFill(value ?? 0);
  const hClass  = height === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{label}</span>
          <span className="font-bold text-slate-700">{confPct(value)}</span>
        </div>
      )}
      <div className={`progress-track ${hClass}`}>
        <div
          className={`progress-fill ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Circular confidence badge — compact display */
export function ConfidencePill({ value }: { value?: number | null }) {
  const pct = Math.round((value ?? 0) * 100);
  const cls = (value ?? 0) >= 0.8
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : (value ?? 0) >= 0.6
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-700 border-red-200';

  return (
    <span className={`badge border ${cls}`}>
      {pct}% confidence
    </span>
  );
}
