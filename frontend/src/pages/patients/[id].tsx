/**
 * Patient detail page — personal info, medical history, screening history
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { Patient, Screening, SEVERITY_LABELS } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  fmtDate, fmtDateTime, priorityBadge, severityClass,
} from '@/lib/utils';
import {
  User, Phone, MapPin, Heart, Calendar, ScanEye,
  ChevronLeft, ArrowRight, Activity, Eye, Clock,
  FileText,
} from 'lucide-react';

export default function PatientDetail() {
  const router  = useRouter();
  const { id }  = router.query;

  const [patient,    setPatient]    = useState<Patient | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (id) load(parseInt(id as string));
  }, [id]);

  const load = async (pid: number) => {
    setLoading(true);
    setError('');
    try {
      const [p, s] = await Promise.all([
        api.getPatient(pid),
        api.getPatientScreenings(pid),
      ]);
      setPatient(p);
      setScreenings(s);
    } catch {
      setError('Failed to load patient details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage message="Loading patient…" />;

  if (error || !patient) {
    return (
      <ErrorState
        fullPage
        title="Patient not found"
        message={error || 'This patient could not be loaded.'}
        onRetry={() => id && load(parseInt(id as string))}
      />
    );
  }

  const INFO_ROWS = [
    { icon: User,     label: 'Age & Gender', val: `${patient.age} years · ${patient.gender}` },
    { icon: Phone,    label: 'Phone',        val: patient.phone ?? '—' },
    {
      icon: MapPin, label: 'Location',
      val: [patient.village_name, patient.district, patient.state].filter(Boolean).join(', ') || '—',
    },
    { icon: Calendar, label: 'Registered', val: fmtDate(patient.created_at) },
  ];

  const MEDICAL_ROWS = [
    { label: 'Has Diabetes',      val: patient.has_diabetes      ?? '—' },
    { label: 'Diabetes Duration', val: patient.diabetes_duration_years ? `${patient.diabetes_duration_years} years` : '—' },
    { label: 'Has Hypertension',  val: patient.has_hypertension  ?? '—' },
    { label: 'Previous Eye Exam', val: patient.previous_eye_exam ?? '—' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-ink-subtle hover:text-ink text-xs font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Patients
        </button>

        {/* Header */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-700
                              flex items-center justify-center text-white text-2xl font-black shadow-sm">
                {patient.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-ink">{patient.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-info font-mono text-[11px]">{patient.patient_id}</span>
                  {screenings.length > 0 && (
                    <span className="badge badge-neutral text-[11px]">
                      {screenings.length} screening{screenings.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/screening/new?patientId=${patient.id}`)}
              className="btn-primary"
            >
              <ScanEye className="w-4 h-4" /> New Screening
            </button>
          </div>
        </div>

        {/* Info + Medical */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Personal info */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" /> Personal Information
            </h3>
            <div className="space-y-3">
              {INFO_ROWS.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-surface-subtle border border-surface-border
                                    flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-ink-subtle" />
                    </div>
                    <div>
                      <p className="text-[11px] text-ink-subtle uppercase tracking-wide font-semibold">{r.label}</p>
                      <p className="text-sm font-medium text-ink capitalize mt-0.5">{r.val}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Medical history */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" /> Medical History
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {MEDICAL_ROWS.map(r => (
                <div key={r.label} className="bg-surface-subtle rounded-xl p-3 border border-surface-border">
                  <p className="text-[10px] text-ink-subtle uppercase tracking-wide font-semibold mb-1">{r.label}</p>
                  <p className={`text-sm font-semibold capitalize
                    ${r.val === 'yes' ? 'text-red-600' : r.val === 'no' ? 'text-emerald-600' : 'text-ink-muted'}`}>
                    {r.val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Screening History ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              Screening History
              {screenings.length > 0 && (
                <span className="badge badge-neutral">{screenings.length}</span>
              )}
            </h3>
            <button
              onClick={() => router.push(`/screening/new?patientId=${patient.id}`)}
              className="btn-primary btn-sm"
            >
              <ScanEye className="w-3.5 h-3.5" /> New Screening
            </button>
          </div>

          {screenings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-subtle">
              <Eye className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No screenings yet</p>
              <p className="text-xs mt-1">Start the first screening for this patient</p>
            </div>
          ) : (
            <div className="space-y-2">
              {screenings.map(s => {
                const isDiabetic = (s.predicted_severity ?? 0) > 0;
                const sev = s.predicted_severity;
                return (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/screening/${s.id}`)}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl
                               hover:bg-surface-subtle transition-colors cursor-pointer
                               border border-transparent hover:border-surface-border group"
                  >
                    {/* Indicator dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0
                      ${s.status === 'clinician_reviewed'  ? 'bg-emerald-400'
                      : s.status === 'analyzed'             ? 'bg-teal-500'
                      : s.status === 'quality_check_failed' ? 'bg-red-400'
                      : 'bg-surface-border'}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 capitalize">
                          {s.eye_side} eye
                        </p>
                        {sev != null && (
                          <span className={`badge text-[11px] ${isDiabetic ? (sev >= 3 ? 'badge-urgent' : 'badge-priority') : 'badge-routine'}`}>
                            {isDiabetic ? SEVERITY_LABELS[sev] : 'No DR'}
                          </span>
                        )}
                        {s.is_demo_mode && <span className="badge badge-demo text-[10px]">DEMO</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fmtDateTime(s.screening_date)}
                        </span>
                        <span className="capitalize">{s.status.replace(/_/g, ' ')}</span>
                        {s.prediction_confidence != null && (
                          <span>{(s.prediction_confidence * 100).toFixed(0)}% confidence</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={priorityBadge(s.referral_priority)}>
                        {(s.referral_priority ?? 'routine').toUpperCase()}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="card border-2 border-teal-200 bg-teal-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-teal-900">Ready to screen this patient?</p>
              <p className="text-teal-700/80 text-sm mt-0.5">
                Upload a fundus image to run the AI screening pipeline
              </p>
            </div>
            <button
              onClick={() => router.push(`/screening/new?patientId=${patient.id}`)}
              className="btn-primary flex-shrink-0"
            >
              <ScanEye className="w-4 h-4" /> Start Screening
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
