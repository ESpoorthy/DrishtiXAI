/**
 * Clinical Reviews — high-priority case queue
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { SEVERITY_LABELS } from '@/types';
import { ErrorBanner } from '@/components/ui/ErrorState';
import { fmtDateShort, priorityBadge } from '@/lib/utils';
import {
  AlertTriangle, Clock, ArrowRight,
  Loader2, CheckCircle2, ScanEye,
} from 'lucide-react';

export default function ReviewsPage() {
  const router = useRouter();
  const [cases,   setCases]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setCases(await api.getHighPriorityCases()); }
    catch { setError('Failed to load review cases. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const urgentCount   = cases.filter(c => c.referral_priority === 'urgent').length;
  const priorityCount = cases.filter(c => c.referral_priority === 'priority').length;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Clinical Reviews</h1>
            <p className="page-sub">Cases requiring attention or clinical review</p>
          </div>
          {!loading && cases.length > 0 && (
            <div className="flex items-center gap-2">
              {urgentCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {urgentCount} Urgent
                </div>
              )}
              {priorityCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  {priorityCount} Priority
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={load} />}

        {/* Content */}
        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200
                            flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="font-semibold text-slate-600 mb-1">All clear!</p>
            <p className="text-sm">No pending reviews right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map(c => {
              const priority = c.referral_priority ?? 'routine';
              const isUrgent = priority === 'urgent';
              return (
                <div key={c.screening_id}
                  onClick={() => router.push(`/screening/${c.screening_id}`)}
                  className={`card-hover p-5 transition-all
                    ${isUrgent ? 'border-red-200 hover:border-red-300' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">

                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center
                                      text-white font-black text-base flex-shrink-0 shadow-sm
                                      ${isUrgent
                                        ? 'bg-gradient-to-br from-red-500 to-orange-400'
                                        : 'bg-gradient-to-br from-amber-500 to-yellow-400'}`}>
                        {(c.patient_name ?? '?').charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {c.patient_name ?? '—'}
                          </h3>
                          <span className={priorityBadge(priority)}>
                            {priority.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
                          {[
                            { label: 'Patient ID', val: c.patient_id ?? '—' },
                            { label: 'Age / Eye',  val: `${c.age ?? '?'} · ${c.eye_side ?? '—'}` },
                            {
                              label: 'AI Prediction',
                              val: c.severity != null
                                ? SEVERITY_LABELS[c.severity]
                                : '—',
                            },
                            {
                              label: 'Confidence',
                              val: c.confidence ? `${(c.confidence * 100).toFixed(1)}%` : '—',
                            },
                          ].map(({ label, val }) => (
                            <div key={label}>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                              <p className="text-xs font-semibold text-slate-700 mt-0.5">{val}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmtDateShort(c.date)}
                          </span>
                          {c.reason && (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              {c.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/screening/${c.screening_id}`); }}
                      className={`btn-sm flex items-center gap-1.5 flex-shrink-0
                                  ${isUrgent ? 'btn-danger' : 'btn-primary'}`}>
                      <ScanEye className="w-3.5 h-3.5" />
                      Review
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
