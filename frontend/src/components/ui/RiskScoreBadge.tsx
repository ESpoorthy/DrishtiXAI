/**
 * RiskScoreBadge — visual composite risk score indicator.
 *
 * Displays the 0–100 normalised score with a category (Low / Medium / High),
 * an arc progress meter, and an optional breakdown tooltip on hover.
 *
 * Props
 * ─────
 * score      : number 0–100
 * category   : 'low' | 'medium' | 'high'
 * breakdown? : { dr_points, glaucoma_points, cataract_points, clinical_points, quality_penalty }
 * compact?   : render inline badge instead of full card
 */
import { useState } from 'react';
import { ShieldAlert, ShieldCheck, ShieldX, Info } from 'lucide-react';
import { RiskBreakdown, RISK_COLORS } from '@/types';
import { safeJson } from '@/lib/utils';

interface Props {
  score:        number;
  category:     string;
  breakdownJson?: string | null;
  compact?:     boolean;
  recommendation?: string | null;
}

const ICONS = {
  low:    ShieldCheck,
  medium: ShieldAlert,
  high:   ShieldX,
};

const ARC_RADIUS = 36;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

export function RiskScoreBadge({
  score, category, breakdownJson, compact = false, recommendation,
}: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const cat      = (category ?? 'low').toLowerCase() as 'low' | 'medium' | 'high';
  const colors   = RISK_COLORS[cat] ?? RISK_COLORS.low;
  const Icon     = ICONS[cat] ?? ShieldCheck;
  const breakdown: RiskBreakdown | null = safeJson<RiskBreakdown>(breakdownJson ?? null, null as any);

  const arcFill  = ARC_CIRCUMFERENCE * (1 - score / 100);

  // ── Compact inline badge ──────────────────────────────────────────────────
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold
                        border ${colors.text} ${colors.bg} ${colors.border}`}>
        <Icon className="w-3 h-3" />
        {score}/100 · {cat.toUpperCase()}
      </span>
    );
  }

  // ── Full card ─────────────────────────────────────────────────────────────
  return (
    <div className={`card border ${colors.border} ${colors.bg} space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.text}`} />
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wide">
            Composite Risk Score
          </p>
        </div>
        {breakdown && (
          <button
            onClick={() => setShowBreakdown(v => !v)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Toggle score breakdown"
          >
            <Info className="w-3.5 h-3.5 text-ink-subtle" />
          </button>
        )}
      </div>

      {/* Score display — arc meter + number */}
      <div className="flex items-center gap-4">
        {/* SVG arc gauge */}
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            {/* Track */}
            <circle
              cx="48" cy="48" r={ARC_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-surface-border"
            />
            {/* Fill */}
            <circle
              cx="48" cy="48" r={ARC_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ARC_CIRCUMFERENCE}
              strokeDashoffset={arcFill}
              className={
                cat === 'high'   ? 'text-red-500'
                : cat === 'medium' ? 'text-amber-500'
                : 'text-emerald-500'
              }
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          {/* Centre text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className={`text-xl font-black ${colors.text}`}>{score}</span>
            <span className="text-[9px] text-ink-subtle font-semibold">/ 100</span>
          </div>
        </div>

        {/* Category label + recommendation */}
        <div className="flex-1 min-w-0">
          <p className={`text-lg font-black ${colors.text}`}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)} Risk
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            {cat === 'high'
              ? 'Prompt ophthalmologist referral recommended'
              : cat === 'medium'
              ? 'Ophthalmologist appointment recommended soon'
              : 'Routine follow-up as clinically advised'}
          </p>
          {recommendation && (
            <p className="text-xs text-ink-subtle mt-1.5 leading-relaxed line-clamp-2">
              {recommendation}
            </p>
          )}
        </div>
      </div>

      {/* Score breakdown (collapsible) */}
      {showBreakdown && breakdown && (
        <div className="pt-2 border-t border-surface-border space-y-1.5 animate-fade-up">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Score Breakdown
          </p>
          {([
            { label: 'Diabetic Retinopathy', pts: breakdown.dr_points,       color: 'bg-rose-400'  },
            { label: 'Glaucoma',             pts: breakdown.glaucoma_points,  color: 'bg-purple-400'},
            { label: 'Cataract (Phase 2)',   pts: breakdown.cataract_points,  color: 'bg-blue-400'  },
            { label: 'Clinical Factors',     pts: breakdown.clinical_points,  color: 'bg-amber-400' },
          ]).map(row => (
            <div key={row.label} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.color}`} />
              <span className="flex-1 text-ink-muted">{row.label}</span>
              <span className="font-semibold text-ink">{row.pts.toFixed(0)} pts</span>
            </div>
          ))}
          {breakdown.quality_penalty > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-400" />
              <span className="flex-1 text-ink-muted">Quality Penalty</span>
              <span className="font-semibold text-red-600">
                −{breakdown.quality_penalty.toFixed(0)} pts
              </span>
            </div>
          )}
          <p className="text-[10px] text-ink-subtle pt-1">
            Score is normalised 0–100. AI decision support only — not a medical risk assessment.
          </p>
        </div>
      )}
    </div>
  );
}
