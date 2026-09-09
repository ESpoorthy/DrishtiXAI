/**
 * ScreeningResultBanner
 *
 * Replaces DiabetesStatusBanner with a three-state clinical result component:
 *
 *   STATE A — No supported abnormality detected      (severity 0)
 *   STATE B — Possible abnormality detected          (severity 1–4)
 *   STATE C — Unable to reliably analyse             (quality_check_failed)
 *
 * Language is carefully chosen to avoid absolute diagnostic claims.
 */
import { CheckCircle2, AlertTriangle, Activity, ShieldAlert } from 'lucide-react';
import { SEVERITY_LABELS } from '@/types';

interface Props {
  /** severity 0–4 when analyzed, null when status is quality_check_failed */
  severity:        number | null | undefined;
  confidence?:     number | null;
  referralPriority?: string | null;
  isDemoMode?:     boolean;
  /** set true when status === 'quality_check_failed' */
  isUncertain?:    boolean;
  qualityGuidance?: string | null;
}

/* Confidence display — note makes clinical intent clear */
function confDisplay(c?: number | null) {
  if (c == null) return null;
  return `${(c * 100).toFixed(1)}%`;
}

export function ScreeningResultBanner({
  severity,
  confidence,
  referralPriority,
  isDemoMode  = false,
  isUncertain = false,
  qualityGuidance,
}: Props) {

  /* ── STATE C — Unable to reliably analyse ── */
  if (isUncertain || severity == null) {
    return (
      <div className="result-uncertain">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Screening Result · State C
            </p>
            <p className="text-lg font-bold text-ink">Unable to reliably analyse</p>
            <p className="text-sm text-ink-muted mt-1">
              {qualityGuidance ??
                'Image quality is insufficient or the image does not appear to be a suitable retinal photograph. Please upload a clearer compatible image or obtain a clinical assessment.'}
            </p>
          </div>
          {isDemoMode && <span className="badge badge-demo flex-shrink-0">DEMO</span>}
        </div>
      </div>
    );
  }

  /* ── STATE A — No supported abnormality detected ── */
  if (severity === 0) {
    return (
      <div className="result-normal">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-1">
              Screening Result · State A
            </p>
            <p className="text-lg font-bold text-emerald-800">
              No supported abnormality detected
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              No patterns associated with diabetic retinopathy were detected in this image.
              {confidence != null && (
                <> Model confidence: <span className="font-semibold">{confDisplay(confidence)}</span>.</>
              )}
            </p>
            <p className="text-xs text-emerald-600/80 mt-1.5">
              This result does not exclude other eye conditions. Routine professional
              follow-up is recommended as clinically appropriate.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {referralPriority && (
              <span className="badge badge-routine">
                {referralPriority.toUpperCase()}
              </span>
            )}
            {isDemoMode && <span className="badge badge-demo">DEMO</span>}
          </div>
        </div>
      </div>
    );
  }

  /* ── STATE B — Possible abnormality detected (severity 1–4) ── */
  const isUrgent   = severity >= 3;
  const severityLabel = SEVERITY_LABELS[severity];
  const priorityBadgeCls =
    referralPriority === 'urgent'   ? 'badge-urgent' :
    referralPriority === 'priority' ? 'badge-priority' :
    'badge-routine';

  return (
    <div className={isUrgent ? 'result-severe' : 'result-abnormal'}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-6 h-6 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1
            ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}>
            Screening Result · State B
          </p>
          <p className={`text-lg font-bold ${isUrgent ? 'text-red-800' : 'text-amber-900'}`}>
            Possible {severityLabel} detected
          </p>
          <p className={`text-sm mt-1 ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
            The model identified patterns possibly consistent with{' '}
            <span className="font-semibold">{severityLabel}</span>.
            {confidence != null && (
              <> Model confidence: <span className="font-semibold">{confDisplay(confidence)}</span>.</>
            )}
          </p>
          <p className={`text-xs mt-1.5 ${isUrgent ? 'text-red-600/80' : 'text-amber-600/80'}`}>
            This is not a diagnosis. Professional clinical evaluation is recommended.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {referralPriority && (
            <span className={`badge ${priorityBadgeCls}`}>
              {referralPriority.toUpperCase()}
            </span>
          )}
          {isDemoMode && <span className="badge badge-demo">DEMO</span>}
        </div>
      </div>

      {/* Urgent callout */}
      {isUrgent && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-700 font-semibold
                        bg-red-100 border border-red-200 rounded-xl px-3 py-2">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          Urgent ophthalmologist review recommended. Please do not delay seeking professional evaluation.
        </div>
      )}
    </div>
  );
}

/** Legacy alias — keeps existing imports working */
export { ScreeningResultBanner as DiabetesStatusBanner };
