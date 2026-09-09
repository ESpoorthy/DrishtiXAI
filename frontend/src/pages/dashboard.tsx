/**
 * Dashboard — overview of screening activity from real DB data
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { ErrorBanner } from '@/components/ui/ErrorState';
import { DashboardStatistics } from '@/types';
import { pct, fmtDateShort, priorityBadge } from '@/lib/utils';
import {
  ScanEye, AlertTriangle, Clock, TrendingUp,
  CheckCircle2, ArrowRight, Eye, Activity, BarChart2,
  Users, ShieldAlert,
} from 'lucide-react';

const SEV_ROWS = [
  { key: 'no_dr',         label: 'No DR',           colour: 'bg-emerald-400' },
  { key: 'mild',          label: 'Mild NPDR',        colour: 'bg-yellow-400'  },
  { key: 'moderate',      label: 'Moderate NPDR',    colour: 'bg-orange-400'  },
  { key: 'severe',        label: 'Severe NPDR',      colour: 'bg-red-500'     },
  { key: 'proliferative', label: 'Proliferative DR', colour: 'bg-rose-700'    },
];

export default function Dashboard() {
  const router = useRouter();
  const [stats,   setStats]   = useState<DashboardStatistics | null>(null);
  const [recent,  setRecent]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [s, r] = await Promise.all([
        api.getDashboardStatistics(),
        api.getRecentScreenings(6),
      ]);
      setStats(s); setRecent(r);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = stats?.total_screenings ?? 0;

  const STAT_CARDS = [
    {
      label: 'Total Screenings', val: total,
      icon: ScanEye, colour: 'bg-teal-600', ring: 'ring-teal-100',
    },
    {
      label: "Today's Screenings", val: stats?.today_screenings ?? 0,
      icon: Clock, colour: 'bg-emerald-600', ring: 'ring-emerald-100',
    },
    {
      label: 'High Risk Cases', val: stats?.high_risk_cases ?? 0,
      icon: AlertTriangle, colour: 'bg-red-600', ring: 'ring-red-100',
    },
    {
      label: 'Pending Reviews', val: stats?.pending_reviews ?? 0,
      icon: CheckCircle2, colour: 'bg-amber-500', ring: 'ring-amber-100',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-sub">Screening activity overview</p>
          </div>
          <button onClick={() => router.push('/patients/register')} className="btn-primary">
            <Eye className="w-4 h-4" /> New Screening
          </button>
        </div>

        {error && <ErrorBanner message={error} onRetry={load} />}

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="card flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide leading-tight">
                      {c.label}
                    </p>
                    <div className={`w-9 h-9 rounded-xl ${c.colour} flex items-center justify-center
                                     shadow-sm ring-4 ${c.ring}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-ink">{c.val.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts row */}
        {loading ? (
          <div className="grid lg:grid-cols-5 gap-5">
            <div className="skeleton h-64 lg:col-span-2" />
            <div className="skeleton h-64 lg:col-span-3" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-5">

            {/* Severity distribution */}
            <div className="card lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-ink text-sm">Severity Distribution</h3>
              </div>
              {total === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <Activity className="w-8 h-8 text-surface-border" />
                  <p className="text-xs text-ink-subtle">No screenings recorded</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {SEV_ROWS.map(s => {
                    const val = (stats?.severity_distribution as any)?.[s.key] ?? 0;
                    const p   = pct(val, total);
                    return (
                      <div key={s.key}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-ink">{s.label}</span>
                          <span className="text-ink-subtle">{val} · {p}%</span>
                        </div>
                        <div className="progress-track">
                          <div className={`progress-fill ${s.colour}`} style={{ width: `${p}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent screenings */}
            <div className="card lg:col-span-3">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-ink text-sm">Recent Screenings</h3>
                </div>
                <button onClick={() => router.push('/patients')}
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold
                             flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <ScanEye className="w-8 h-8 text-surface-border" />
                  <p className="text-xs text-ink-subtle">No screenings yet</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recent.map(s => {
                    const priority = s.referral_priority ?? 'routine';
                    return (
                      <div key={s.screening_id}
                        onClick={() => router.push(`/screening/${s.screening_id}`)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                   hover:bg-surface-subtle transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center
                                        text-white text-xs font-bold flex-shrink-0">
                          {(s.patient_name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">
                            {s.patient_name ?? '—'}
                          </p>
                          <p className="text-xs text-ink-subtle capitalize">
                            {s.eye_side ?? '—'} eye · {fmtDateShort(s.date)}
                          </p>
                        </div>
                        <span className={priorityBadge(priority)}>{priority}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-ink-subtle opacity-0
                                              group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* System performance */}
        {!loading && stats && (
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-ink text-sm">System Performance</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
              {[
                {
                  label: 'AI–Clinician Agreement',
                  val: `${stats.agreement_rate}%`,
                  sub: 'Based on reviewed cases',
                  colour: 'bg-emerald-400',
                  width: stats.agreement_rate,
                },
                {
                  label: 'Poor Quality Rate',
                  val: total > 0 ? `${pct(stats.poor_quality_images, total)}%` : '—',
                  sub: 'Images needing recapture',
                  colour: 'bg-amber-400',
                  width: total > 0 ? pct(stats.poor_quality_images, total) : 0,
                },
                {
                  label: 'Urgent Referrals',
                  val: String(stats.urgent_referrals),
                  sub: 'Require prompt attention',
                  colour: 'bg-red-500',
                  width: total > 0 ? pct(stats.urgent_referrals, total) : 0,
                },
              ].map(m => (
                <div key={m.label} className="pt-4 sm:pt-0 sm:px-6 first:pl-0 last:pr-0">
                  <p className="text-xs text-ink-subtle uppercase tracking-wide font-semibold mb-1">
                    {m.label}
                  </p>
                  <p className="text-2xl font-black text-ink">{m.val}</p>
                  <div className="progress-track my-2">
                    <div className={`progress-fill ${m.colour}`} style={{ width: `${m.width}%` }} />
                  </div>
                  <p className="text-xs text-ink-subtle">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        {!loading && (
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Register Patient', sub: 'Start a new screening workflow',
                icon: Users, href: '/patients/register' },
              { label: 'Clinical Reviews', sub: 'High-priority cases awaiting review',
                icon: ShieldAlert, href: '/reviews' },
              { label: 'Model Performance', sub: 'Confidence & quality metrics',
                icon: BarChart2, href: '/model-performance' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className="card-hover flex items-center gap-4 text-left p-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100
                                  flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-teal-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink text-sm">{item.label}</p>
                    <p className="text-xs text-ink-muted truncate">{item.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-subtle ml-auto flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
