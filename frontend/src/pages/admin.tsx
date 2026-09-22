/**
 * Admin Dashboard — system overview for admin role only.
 *
 * Shows:
 *  • Key metrics cards (users, patients, screenings, high-risk)
 *  • Role breakdown
 *  • Facility activity table
 *  • Recent audit log
 *  • Disease distribution charts (bar)
 */
import { useEffect, useState } from 'react';
import { useRouter }           from 'next/router';
import Layout                  from '@/components/Layout';
import { api }                 from '@/lib/api';
import { LoadingSpinner }      from '@/components/ui/LoadingSpinner';
import { ErrorState }          from '@/components/ui/ErrorState';
import { useAuthStore }        from '@/store/authStore';
import { AdminSummary, DashboardStatistics } from '@/types';
import { fmtDateTime }         from '@/lib/utils';
import {
  Users, ScanEye, AlertTriangle, Activity,
  Building2, ShieldCheck, ClipboardList,
  TrendingUp, Microscope, UserCheck,
} from 'lucide-react';

// ── Tiny bar-chart component ──────────────────────────────────────────────────
function MiniBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-ink-muted truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-ink">{value}</span>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-black text-ink">{value}</p>
        <p className="text-xs text-ink-muted font-medium">{label}</p>
        {sub && <p className="text-[11px] text-ink-subtle mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router   = useRouter();
  const { user } = useAuthStore();

  const [stats,   setStats]   = useState<DashboardStatistics | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [s, a] = await Promise.all([
        api.getDashboardStatistics(),
        api.getAdminSummary(),
      ]);
      setStats(s);
      setSummary(a);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to load admin data.');
    } finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner fullPage message="Loading admin dashboard…" />;
  if (error || !stats || !summary) {
    return (
      <ErrorState
        fullPage
        title="Admin data unavailable"
        message={error || 'Could not load admin summary.'}
        onRetry={load}
      />
    );
  }

  const totalDiseaseScreenings =
    (stats.severity_distribution.no_dr + stats.severity_distribution.mild +
     stats.severity_distribution.moderate + stats.severity_distribution.severe +
     stats.severity_distribution.proliferative) || 1;

  const totalGlaucoma =
    (stats.glaucoma_distribution.none + stats.glaucoma_distribution.suspect +
     stats.glaucoma_distribution.probable + stats.glaucoma_distribution.advanced) || 1;

  const totalCataract =
    (stats.cataract_distribution.none + stats.cataract_distribution.trace +
     stats.cataract_distribution.moderate + stats.cataract_distribution.dense) || 1;

  const maxFacility = summary.facility_breakdown[0]?.count ?? 1;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-up">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              Admin Dashboard
            </h1>
            <p className="page-sub">System overview — all facilities</p>
          </div>
          <button onClick={load} className="btn-secondary btn-sm">Refresh</button>
        </div>

        {/* ── System metric cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}      label="Total Users"         value={summary.total_users}
            sub={`${summary.active_users} active`}  color="bg-teal-600" />
          <StatCard icon={UserCheck}  label="Total Patients"      value={summary.total_patients}
            color="bg-blue-600" />
          <StatCard icon={ScanEye}    label="Total Screenings"    value={summary.total_screenings}
            sub={`${stats.today_screenings} today`} color="bg-purple-600" />
          <StatCard icon={AlertTriangle} label="High-Risk Screenings" value={summary.high_risk_screenings}
            color="bg-red-600" />
        </div>

        {/* ── Screening stats row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Activity}      label="Urgent Referrals"  value={stats.urgent_referrals}     color="bg-rose-500" />
          <StatCard icon={ClipboardList} label="Pending Reviews"   value={stats.pending_reviews}      color="bg-amber-500" />
          <StatCard icon={Microscope}    label="Clinician Reviewed" value={stats.reviewed_count}       color="bg-emerald-600" />
          <StatCard icon={TrendingUp}    label="Agreement Rate"    value={`${stats.agreement_rate}%`} color="bg-cyan-600" />
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left col — disease distributions */}
          <div className="lg:col-span-2 space-y-5">

            {/* DR distribution */}
            <div className="card">
              <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                Diabetic Retinopathy Distribution
              </h3>
              <div className="space-y-2">
                <MiniBar label="No DR"           value={stats.severity_distribution.no_dr}       max={totalDiseaseScreenings} color="bg-emerald-400" />
                <MiniBar label="Mild NPDR"        value={stats.severity_distribution.mild}         max={totalDiseaseScreenings} color="bg-yellow-400" />
                <MiniBar label="Moderate NPDR"    value={stats.severity_distribution.moderate}    max={totalDiseaseScreenings} color="bg-amber-400"  />
                <MiniBar label="Severe NPDR"      value={stats.severity_distribution.severe}      max={totalDiseaseScreenings} color="bg-orange-500" />
                <MiniBar label="Proliferative DR" value={stats.severity_distribution.proliferative} max={totalDiseaseScreenings} color="bg-red-500"  />
              </div>
            </div>

            {/* Glaucoma + Cataract row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                  <ScanEye className="w-4 h-4 text-purple-500" />
                  Glaucoma Detection
                </h3>
                <div className="space-y-2">
                  <MiniBar label="No Indicators" value={stats.glaucoma_distribution.none}    max={totalGlaucoma} color="bg-emerald-400" />
                  <MiniBar label="Suspect"        value={stats.glaucoma_distribution.suspect} max={totalGlaucoma} color="bg-amber-400" />
                  <MiniBar label="Probable"       value={stats.glaucoma_distribution.probable}max={totalGlaucoma} color="bg-orange-500" />
                  <MiniBar label="Advanced"       value={stats.glaucoma_distribution.advanced}max={totalGlaucoma} color="bg-red-500" />
                </div>
              </div>
              <div className="card">
                <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-blue-500" />
                  Cataract Detection
                  <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 rounded-md font-bold">P2</span>
                </h3>
                <div className="space-y-2">
                  <MiniBar label="No Indicators" value={stats.cataract_distribution.none}     max={totalCataract} color="bg-emerald-400" />
                  <MiniBar label="Trace"          value={stats.cataract_distribution.trace}    max={totalCataract} color="bg-yellow-400" />
                  <MiniBar label="Moderate"       value={stats.cataract_distribution.moderate} max={totalCataract} color="bg-orange-500" />
                  <MiniBar label="Dense"          value={stats.cataract_distribution.dense}    max={totalCataract} color="bg-red-500"    />
                </div>
              </div>
            </div>

            {/* Facility breakdown */}
            <div className="card">
              <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Facility Activity (Top 10)
              </h3>
              {summary.facility_breakdown.length === 0 ? (
                <p className="text-sm text-ink-subtle italic">No facility data yet.</p>
              ) : (
                <div className="space-y-2">
                  {summary.facility_breakdown.map((row, i) => (
                    <MiniBar
                      key={i}
                      label={row.facility}
                      value={row.count}
                      max={maxFacility}
                      color="bg-teal-500"
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right col */}
          <div className="space-y-5">

            {/* Role breakdown */}
            <div className="card">
              <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                User Roles
              </h3>
              <div className="space-y-3">
                {[
                  { role: 'health_worker', label: 'Health Workers', color: 'bg-emerald-500' },
                  { role: 'clinician',     label: 'Clinicians',     color: 'bg-teal-500'    },
                  { role: 'admin',         label: 'Administrators', color: 'bg-amber-500'   },
                ].map(({ role, label, color }) => {
                  const count = summary.role_breakdown[role] ?? 0;
                  const maxRole = Math.max(...Object.values(summary.role_breakdown), 1);
                  return (
                    <div key={role} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                        <span className="text-xs text-ink-muted truncate">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${(count / maxRole) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-ink w-5 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly trend */}
            {stats.weekly_trend?.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Weekly Screenings
                </h3>
                <div className="flex items-end gap-1.5 h-20">
                  {stats.weekly_trend.map((day, i) => {
                    const maxCount = Math.max(...stats.weekly_trend.map(d => d.count), 1);
                    const heightPct = (day.count / maxCount) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                          <div
                            className="w-full rounded-t bg-teal-500/80 min-h-[3px]"
                            style={{ height: `${heightPct}%` }}
                            title={`${day.count} screenings`}
                          />
                        </div>
                        <span className="text-[9px] text-ink-subtle">{day.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent audit log */}
            <div className="card">
              <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                Recent Audit Log
              </h3>
              {summary.recent_audit.length === 0 ? (
                <p className="text-xs text-ink-subtle italic">No audit entries yet.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {summary.recent_audit.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5
                        ${entry.action === 'screening_analyzed' ? 'bg-teal-400'
                        : entry.action === 'clinician_review'   ? 'bg-emerald-400'
                        : 'bg-slate-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink capitalize truncate">
                          {entry.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-ink-subtle">
                          {entry.user_role}
                          {entry.screening_id ? ` · Screening #${entry.screening_id}` : ''}
                        </p>
                      </div>
                      <span className="text-ink-subtle flex-shrink-0 text-right">
                        {entry.timestamp ? fmtDateTime(entry.timestamp) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Disclaimer */}
        <div className="alert alert-neutral">
          <p className="text-xs text-ink-subtle">
            Admin dashboard displays system-wide statistics. All AI predictions are
            research prototypes and must not be used clinically. Ensure patient data
            privacy is maintained in accordance with applicable regulations.
          </p>
        </div>

      </div>
    </Layout>
  );
}
