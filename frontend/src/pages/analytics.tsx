/**
 * Analytics — model performance & operational metrics (real DB data)
 */
import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { ErrorBanner } from '@/components/ui/ErrorState';
import { pct } from '@/lib/utils';
import {
  TrendingUp, Activity, Target, AlertCircle,
  ThumbsUp, ThumbsDown, BarChart3, Loader2,
  CheckCircle2, Image as ImageIcon,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await api.getModelPerformance()); }
    catch { setError('Failed to load analytics. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    </Layout>
  );

  const total    = data?.total_predictions ?? 0;
  const reviewed = data?.clinician_review?.reviewed ?? 0;
  const agreed   = data?.clinician_review?.agreed   ?? 0;
  const agreeRate= data?.clinician_review?.agreement_rate ?? 0;

  const confDist = [
    { label: 'High Confidence',   sub: '≥ 80%', val: data?.confidence_distribution?.high   ?? 0, colour: 'bg-emerald-400', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Medium Confidence', sub: '60–80%',val: data?.confidence_distribution?.medium ?? 0, colour: 'bg-amber-400',   cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: 'Low Confidence',    sub: '< 60%', val: data?.confidence_distribution?.low    ?? 0, colour: 'bg-red-400',     cls: 'text-red-700 bg-red-50 border-red-200' },
  ];

  const qualDist = [
    { label: 'Good',       val: data?.quality_distribution?.good       ?? 0, colour: 'bg-emerald-400', icon: CheckCircle2, iconCls: 'text-emerald-500' },
    { label: 'Acceptable', val: data?.quality_distribution?.acceptable ?? 0, colour: 'bg-amber-400',   icon: AlertCircle,  iconCls: 'text-amber-500' },
    { label: 'Poor',       val: data?.quality_distribution?.poor       ?? 0, colour: 'bg-red-400',     icon: ImageIcon,    iconCls: 'text-red-500' },
  ];

  return (
    <Layout>
      <div className="space-y-7 animate-fade-up">

        {/* Header */}
        <div>
          <h1 className="page-title">Analytics & Performance</h1>
          <p className="page-sub">AI model operational metrics</p>
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={load} />}

        {/* Demo notice */}
        {data?.note && (
          <div className="alert alert-warning">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{data.note}</p>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: 'Total Predictions', val: total.toLocaleString(),
              icon: Activity, gradient: 'from-teal-700 to-teal-600', ring: 'ring-teal-100',
            },
            {
              label: 'Avg Confidence',
              val: `${((data?.average_confidence ?? 0) * 100).toFixed(1)}%`,
              icon: Target, gradient: 'from-emerald-600 to-emerald-500', ring: 'ring-emerald-100',
            },
            {
              label: 'Agreement Rate',
              val: `${agreeRate}%`,
              icon: TrendingUp, gradient: 'from-teal-600 to-emerald-500', ring: 'ring-teal-100',
            },
            {
              label: 'Cases Reviewed', val: reviewed.toLocaleString(),
              icon: BarChart3, gradient: 'from-amber-600 to-amber-500', ring: 'ring-amber-100',
            },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="card flex flex-col gap-4">
                <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{k.label}</p>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.gradient}
                                  flex items-center justify-center shadow-sm ring-4 ${k.ring}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-black text-ink">{k.val}</p>
              </div>
            );
          })}
        </div>

        {/* Two-column row */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Confidence distribution */}
          <div className="card space-y-5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-ink">Confidence Distribution</h3>
            </div>
            {total === 0 ? (
              <p className="text-sm text-ink-subtle text-center py-8">No predictions yet</p>
            ) : (
              <div className="space-y-4">
                {confDist.map(c => {
                  const p = pct(c.val, total);
                  return (
                    <div key={c.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className={`badge border text-[11px] ${c.cls}`}>{c.label}</span>
                          <span className="text-[11px] text-ink-subtle ml-2">{c.sub}</span>
                        </div>
                        <span className="text-xs font-bold text-ink">{c.val}</span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill ${c.colour} animate-progress-bar`}
                             style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quality distribution */}
          <div className="card space-y-5">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-ink">Image Quality Distribution</h3>
            </div>
            {total === 0 ? (
              <p className="text-sm text-ink-subtle text-center py-8">No images yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {qualDist.map(q => {
                  const Icon = q.icon;
                  const p    = pct(q.val, total);
                  return (
                    <div key={q.label}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl
                                 bg-surface-subtle border border-surface-border text-center">
                      <Icon className={`w-6 h-6 ${q.iconCls}`} />
                      <p className="text-2xl font-black text-ink">{q.val}</p>
                      <p className="text-xs font-semibold text-ink-muted">{q.label}</p>
                      <div className="w-full progress-track">
                        <div className={`progress-fill ${q.colour}`} style={{ width:`${p}%` }} />
                      </div>
                      <span className="text-[11px] text-ink-subtle">{p}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Clinician review */}
        <div className="card">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-ink">Clinician Review Statistics</h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-surface-border mb-6">
            {[
          { label: 'Cases Reviewed', val: reviewed, sub: 'Total clinician reviews', icon: BarChart3,  cls: 'text-teal-600' },
              { label: 'Agreed with AI', val: agreed,   sub: 'AI assessment confirmed',  icon: ThumbsUp,  cls: 'text-emerald-600' },
              { label: 'Disagreed',      val: reviewed - agreed, sub: 'AI assessment overridden', icon: ThumbsDown, cls: 'text-red-500' },
            ].map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="pt-4 sm:pt-0 sm:px-6 first:pl-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${m.cls}`} />
                  <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{m.label}</p>
                  </div>
                  <p className="text-3xl font-black text-ink">{m.val}</p>
                  <p className="text-xs text-ink-subtle mt-0.5">{m.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Agreement rate bar */}
          <div className="bg-surface-subtle rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink">Overall Agreement Rate</p>
              <p className="text-2xl font-black text-ink">{agreeRate}%</p>
            </div>
            <div className="progress-track h-3">
              <div className="progress-fill h-3 bg-teal-500"
                   style={{ width: `${agreeRate}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-ink-subtle mt-1.5">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
