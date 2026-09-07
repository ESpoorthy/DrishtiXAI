/**
 * Patient detail page
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { Patient, Screening, SEVERITY_LABELS } from '@/types';
import {
  User, Phone, MapPin, Heart, Calendar, ScanEye,
  ChevronLeft, AlertCircle, Loader2, ArrowRight, Activity,
} from 'lucide-react';

function fmtDate(d?: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return '—'; }
}

function priorityBadge(p?: string | null) {
  if (p === 'urgent')   return 'badge badge-urgent';
  if (p === 'priority') return 'badge badge-priority';
  return 'badge badge-routine';
}

export default function PatientDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [patient,    setPatient]    = useState<Patient | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (id) load(parseInt(id as string));
  }, [id]);

  const load = async (pid: number) => {
    try {
      const p = await api.getPatient(pid);
      setPatient(p);
      // Load screenings for this patient
      try {
        const all = await api.getPatients(); // we use screening list via patient context
        // Fetch recent screenings from dashboard endpoint as fallback
      } catch { /* screenings optional */ }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    </Layout>
  );

  if (!patient) return (
    <Layout>
      <div className="card flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertCircle className="w-12 h-12 mb-3 opacity-40" />
        <p className="font-semibold">Patient not found</p>
      </div>
    </Layout>
  );

  const INFO_ROWS = [
    { icon: User,     label: 'Age & Gender', val: `${patient.age} years · ${patient.gender}` },
    { icon: Phone,    label: 'Phone',        val: patient.phone ?? '—' },
    { icon: MapPin,   label: 'Location',     val: [patient.village_name, patient.district, patient.state].filter(Boolean).join(', ') || '—' },
    { icon: Calendar, label: 'Registered',   val: fmtDate(patient.created_at) },
  ];

  const MEDICAL_ROWS = [
    { label: 'Has Diabetes',       val: patient.has_diabetes ?? '—' },
    { label: 'Diabetes Duration',  val: patient.diabetes_duration_years ? `${patient.diabetes_duration_years} years` : '—' },
    { label: 'Has Hypertension',   val: patient.has_hypertension ?? '—' },
    { label: 'Previous Eye Exam',  val: patient.previous_eye_exam ?? '—' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700
                     text-xs font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Patients
        </button>

        {/* Header card */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-primary-500
                              flex items-center justify-center text-white text-2xl font-black shadow-md">
                {patient.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
                <span className="badge badge-info font-mono text-[11px] mt-1">
                  {patient.patient_id}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/screening/new?patientId=${patient.id}`)}
              className="btn-primary">
              <ScanEye className="w-4 h-4" /> New Screening
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Personal info */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-500" /> Personal Information
            </h3>
            <div className="space-y-3">
              {INFO_ROWS.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100
                                    flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">{r.label}</p>
                      <p className="text-sm font-medium text-slate-700 capitalize mt-0.5">{r.val}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Medical history */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" /> Medical History
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {MEDICAL_ROWS.map(r => (
                <div key={r.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">
                    {r.label}
                  </p>
                  <p className={`text-sm font-semibold capitalize
                    ${r.val === 'yes' ? 'text-red-600'
                    : r.val === 'no'  ? 'text-emerald-600'
                    : 'text-slate-600'}`}>
                    {r.val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="card bg-gradient-to-r from-brand-600 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Ready to screen?</p>
              <p className="text-blue-100 text-sm mt-0.5">
                Upload a fundus image to run the AI screening pipeline
              </p>
            </div>
            <button
              onClick={() => router.push(`/screening/new?patientId=${patient.id}`)}
              className="btn flex-shrink-0 bg-white text-brand-700 hover:bg-blue-50 shadow-lg font-bold">
              <ScanEye className="w-4 h-4" /> Start Screening
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
