/**
 * Diabetic status hero banner — shared between new.tsx and [id].tsx
 */
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SEVERITY_LABELS } from '@/types';
import { getDiabetesTheme, isDiabetic, confPct, priorityBadge } from '@/lib/utils';

interface Props {
  severity: number;
  confidence?: number | null;
  referralPriority?: string | null;
  isDemoMode?: boolean;
}

export function DiabetesStatusBanner({
  severity,
  confidence,
  referralPriority,
  isDemoMode = false,
}: Props) {
  const diabetic = isDiabetic(severity);
  const theme    = getDiabetesTheme(severity);

  return (
    <div
      className={`rounded-2xl p-5 border-2 flex flex-col sm:flex-row items-start sm:items-center gap-5
                  ${theme.bg} ${theme.border}`}
    >
      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                       flex-shrink-0 shadow-md ${theme.iconBg}`}>
        {theme.icon === 'alert'
          ? <AlertTriangle className="w-7 h-7 text-white" />
          : <CheckCircle2  className="w-7 h-7 text-white" />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-lg font-black ${theme.heading}`}>
          {diabetic ? 'Diabetic Retinopathy Detected' : 'No Diabetic Retinopathy Detected'}
        </p>
        <p className={`text-sm mt-0.5 ${theme.sub}`}>
          <span className="font-semibold">{SEVERITY_LABELS[severity]}</span>
          {confidence != null && (
            <> &nbsp;·&nbsp; Confidence: <span className="font-semibold">{confPct(confidence)}</span></>
          )}
          {referralPriority && (
            <> &nbsp;·&nbsp; Referral: <span className="font-semibold">{referralPriority.toUpperCase()}</span></>
          )}
        </p>
        <p className={`text-xs mt-1 ${theme.sub} opacity-80`}>
          {diabetic
            ? severity >= 3
              ? 'Urgent ophthalmologist referral recommended. Immediate attention required.'
              : 'Ophthalmologist review recommended. Schedule appointment soon.'
            : 'No signs of DR detected. Routine annual screening recommended.'}
        </p>
      </div>

      {/* Right badges */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {referralPriority && (
          <span className={priorityBadge(referralPriority)}>
            {referralPriority.toUpperCase()}
          </span>
        )}
        {isDemoMode && <span className="badge badge-demo">DEMO</span>}
      </div>
    </div>
  );
}
