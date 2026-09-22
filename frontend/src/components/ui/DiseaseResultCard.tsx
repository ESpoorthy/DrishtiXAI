/**
 * DiseaseResultCard — individual disease result panel.
 *
 * Used for DR, Glaucoma, and Cataract results inside MultiDiseaseResults.
 *
 * Props
 * ─────
 * disease      : 'dr' | 'glaucoma' | 'cataract'
 * severity     : number | undefined
 * confidence   : number | undefined
 * label        : string (severity label)
 * message      : string (safe clinical message)
 * requiresReview : boolean
 * isPhase2?    : boolean (cataract only)
 * maxSeverity  : number (4 for DR, 3 for others)
 * severityLabels : Record<number, string>
 */
import { AlertTriangle, Activity, Eye, Sparkles, Tag } from 'lucide-react';
import { ConfidenceBar } from './ConfidenceBar';
import { confPct } from '@/lib/utils';

type Disease = 'dr' | 'glaucoma' | 'cataract';

interface Props {
  disease:        Disease;
  severity?:      number | null;
  confidence?:    number | null;
  label?:         string | null;
  message?:       string | null;
  requiresReview: boolean;
  isPhase2?:      boolean;
  maxSeverity:    number;
  severityLabels: Record<number, string>;
}

const DISEASE_META: Record<Disease, {
  title:    string;
  icon:     React.ComponentType<{ className?: string }>;
  color:    string;         // Tailwind text colour class
  bgZero:   string;
  bgAbnormal: string;
}> = {
  dr: {
    title:      'Diabetic Retinopathy',
    icon:       Activity,
    color:      'text-rose-600',
    bgZero:     'bg-emerald-50 border-emerald-200',
    bgAbnormal: 'bg-rose-50 border-rose-200',
  },
  glaucoma: {
    title:      'Glaucoma',
    icon:       Eye,
    color:      'text-purple-600',
    bgZero:     'bg-emerald-50 border-emerald-200',
    bgAbnormal: 'bg-purple-50 border-purple-200',
  },
  cataract: {
    title:      'Cataract',
    icon:       Sparkles,
    color:      'text-blue-600',
    bgZero:     'bg-emerald-50 border-emerald-200',
    bgAbnormal: 'bg-blue-50 border-blue-200',
  },
};

function severityBarColor(severity: number, max: number): string {
  const ratio = severity / max;
  if (ratio === 0)     return 'bg-emerald-400';
  if (ratio <= 0.33)   return 'bg-amber-400';
  if (ratio <= 0.67)   return 'bg-orange-500';
  return 'bg-red-500';
}

export function DiseaseResultCard({
  disease, severity, confidence, label, message,
  requiresReview, isPhase2, maxSeverity, severityLabels,
}: Props) {
  const meta      = DISEASE_META[disease];
  const Icon      = meta.icon;
  const hasResult = severity != null;
  const isNormal  = severity === 0;
  const cardClass = !hasResult
    ? 'card'
    : isNormal
    ? `card border ${meta.bgZero}`
    : `card border ${meta.bgAbnormal}`;

  const bars = Array.from({ length: maxSeverity + 1 }, (_, i) => i);

  return (
    <div className={cardClass}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center
                          ${isNormal ? 'bg-emerald-100' : hasResult ? 'bg-white/80 border border-surface-border' : 'bg-surface-subtle'}`}>
            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-ink">{meta.title}</p>
            {isPhase2 && (
              <span className="text-[9px] font-semibold text-blue-600 bg-blue-100
                               px-1.5 rounded-md">Phase 2</span>
            )}
          </div>
        </div>
        {hasResult && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
            ${isNormal
              ? 'bg-emerald-100 text-emerald-700'
              : severity! >= maxSeverity * 0.6
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'}`}>
            {label ?? `Level ${severity}`}
          </span>
        )}
      </div>

      {/* Severity level bar */}
      {hasResult && (
        <div className="mb-3">
          <div className="flex gap-1 mb-1">
            {bars.map(i => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors
                  ${i <= severity!
                    ? severityBarColor(severity!, maxSeverity)
                    : 'bg-surface-border'}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-ink-subtle">
            <span>None</span>
            <span>Severe</span>
          </div>
        </div>
      )}

      {/* Confidence */}
      {hasResult && confidence != null && (
        <ConfidenceBar value={confidence} height="sm" label="Confidence" />
      )}

      {/* Message */}
      {message && (
        <p className="text-xs text-ink-muted mt-2 leading-relaxed line-clamp-3">
          {message}
        </p>
      )}

      {/* Review flag */}
      {requiresReview && hasResult && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium
                        bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          Requires clinical review
        </div>
      )}

      {/* Not yet analyzed */}
      {!hasResult && (
        <p className="text-xs text-ink-subtle italic">Not yet analysed</p>
      )}
    </div>
  );
}
