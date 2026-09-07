/**
 * New Screening — Upload → Analyse → Results
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { Patient, Screening, SEVERITY_LABELS } from '@/types';
import {
  Upload, Eye, AlertCircle, CheckCircle2, Loader2,
  ImageIcon, AlertTriangle, ChevronLeft, Sparkles,
  ScanEye, ArrowRight, RotateCcw,
} from 'lucide-react';

type Step = 'upload' | 'uploading' | 'analyzing' | 'results';

/* ── helpers ── */
function priorityBadge(p?: string) {
  if (p === 'urgent')   return 'badge badge-urgent';
  if (p === 'priority') return 'badge badge-priority';
  return 'badge badge-routine';
}
function qualityBadge(q?: string) {
  if (q === 'good')       return 'badge badge-good';
  if (q === 'acceptable') return 'badge badge-acceptable';
  return 'badge badge-poor';
}
function severityClass(s: number) {
  return ['sev-0','sev-1','sev-2','sev-3','sev-4'][s] ?? 'badge-neutral';
}
function confColor(c: number) {
  if (c >= 0.8) return 'bg-emerald-400';
  if (c >= 0.6) return 'bg-amber-400';
  return 'bg-red-400';
}

export default function NewScreening() {
  const router = useRouter();
  const { patientId } = router.query;

  const [patient,   setPatient]   = useState<Patient | null>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [eyeSide,   setEyeSide]   = useState<'left' | 'right'>('right');
  const [screening, setScreening] = useState<Screening | null>(null);
  const [step,      setStep]      = useState<Step>('upload');
  const [error,     setError]     = useState('');
  const [dragging,  setDragging]  = useState(false);

  useEffect(() => {
    if (patientId) loadPatient(parseInt(patientId as string));
  }, [patientId]);

  const loadPatient = async (id: number) => {
    try { setPatient(await api.getPatient(id)); }
    catch { setError('Failed to load patient information.'); }
  };

  const processFile = (f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please select an image file (JPG / PNG).'); return; }
    if (f.size > 10 * 1024 * 1024)    { setError('File size must be under 10 MB.'); return; }
    setFile(f); setError('');
    const r = new FileReader();
    r.onloadend = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }, []);

  const handleAnalyse = async () => {
    if (!file || !patient) return;
    setError(''); setStep('uploading');
    try {
      const s = await api.createScreening(patient.id, eyeSide, file);
      setScreening(s); setStep('analyzing');
      const done = await api.analyzeScreening(s.id);
      setScreening(done); setStep('results');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Screening failed. Please try again.');
      setStep('upload');
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setScreening(null);
    setStep('upload'); setError('');
  };

  /* loading state */
  if (!patient) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
      </div>
    </Layout>
  );

  /* ── Step indicator data ── */
  const STEPS = [
    { id: 'upload',    label: 'Upload' },
    { id: 'analyzing', label: 'Analyse' },
    { id: 'results',   label: 'Results' },
  ];
  const currentIdx = step === 'uploading' ? 0 : step === 'analyzing' ? 1 : step === 'results' ? 2 : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">

        {/* ── Header banner ── */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-primary-600
                        p-6 text-white shadow-lg">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-blue-200 hover:text-white
                       text-xs font-medium mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Patients
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">DR Screening</h1>
              <p className="text-blue-100 text-sm mt-0.5">
                {patient.full_name}
                <span className="ml-2 text-blue-300 font-mono text-xs">#{patient.patient_id}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20
                            flex items-center justify-center">
              <ScanEye className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Step pills */}
          <div className="flex items-center gap-2 mt-5">
            {STEPS.map((s, i) => {
              const done   = currentIdx > i;
              const active = currentIdx === i;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center
                                  text-xs font-bold flex-shrink-0 transition-all
                                  ${done   ? 'bg-emerald-400 text-white'
                                   : active ? 'bg-white text-brand-700 shadow-md scale-110'
                                   :          'bg-white/20 text-blue-200'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium
                    ${active ? 'text-white' : done ? 'text-emerald-300' : 'text-blue-300'}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="w-8 h-px bg-white/25 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ══════════════ UPLOAD STEP ══════════════ */}
        {step === 'upload' && (
          <div className="card space-y-6">

            {/* Eye selector */}
            <div>
              <label className="label">Select Eye</label>
              <div className="grid grid-cols-2 gap-3">
                {(['left', 'right'] as const).map(side => (
                  <button key={side} type="button" onClick={() => setEyeSide(side)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl
                                border-2 font-semibold text-sm transition-all
                                ${eyeSide === side
                                  ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <Eye className="w-4 h-4" />
                    {side.charAt(0).toUpperCase() + side.slice(1)} Eye
                  </button>
                ))}
              </div>
            </div>

            {/* Drop zone / preview */}
            {!preview ? (
              <label htmlFor="file-input"
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-4
                            border-2 border-dashed rounded-2xl p-14 cursor-pointer
                            transition-all duration-200
                            ${dragging
                              ? 'border-brand-400 bg-brand-50 scale-[1.01]'
                              : 'border-slate-300 hover:border-brand-300 hover:bg-slate-50'}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                                transition-colors
                                ${dragging ? 'bg-brand-100' : 'bg-slate-100'}`}>
                  <Upload className={`w-8 h-8 transition-colors
                                     ${dragging ? 'text-brand-500' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Drag & drop or <span className="text-brand-600">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">JPG, JPEG, PNG · Max 10 MB</p>
                </div>
                <input id="file-input" type="file" accept="image/*"
                  onChange={handleFileInput} className="hidden" />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                  <img src={preview} alt="Fundus preview"
                    className="w-full max-h-72 object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <ImageIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white text-xs font-medium truncate max-w-[200px]">
                      {file?.name}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="badge badge-good">Ready</span>
                  </div>
                </div>
                <button onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700
                             font-medium transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Remove & re-upload
                </button>
              </div>
            )}

            {/* Action row */}
            {file && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
                <button onClick={handleAnalyse} className="btn-primary">
                  <Sparkles className="w-4 h-4" /> Upload & Analyse
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ PROCESSING ══════════════ */}
        {(step === 'uploading' || step === 'analyzing') && (
          <div className="card flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center">
                <Eye className="w-10 h-10 text-brand-400" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-brand-200
                              border-t-brand-600 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                {step === 'uploading' ? 'Uploading Image…' : 'Running AI Pipeline…'}
              </h3>
              <p className="text-slate-500 text-sm mt-1.5 max-w-xs">
                {step === 'uploading'
                  ? 'Securely saving fundus image'
                  : 'Quality check → EfficientNet prediction → Grad-CAM → Referral engine'}
              </p>
            </div>
            <div className="w-56 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-primary-400
                              animate-pulse-soft" style={{ width: step === 'uploading' ? '35%' : '75%',
                              transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* ══════════════ RESULTS ══════════════ */}
        {step === 'results' && screening && (
          <div className="space-y-5 animate-fade-up">

            {/* Demo banner */}
            {screening.is_demo_mode && (
              <div className="alert alert-warning">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">DEMONSTRATION MODE</p>
                  <p className="text-xs mt-0.5 opacity-80">
                    Image-based prediction for demo purposes. Not for clinical use.
                  </p>
                </div>
              </div>
            )}

            {/* ── Diabetic status hero card ── */}
            {screening.predicted_severity != null && (() => {
              const isDiabetic = screening.predicted_severity > 0;
              const sev  = screening.predicted_severity;
              const conf = ((screening.prediction_confidence ?? 0) * 100).toFixed(1);
              return (
                <div className={`rounded-2xl p-6 border-2 flex flex-col sm:flex-row items-start sm:items-center gap-5
                  ${isDiabetic
                    ? sev >= 3 ? 'bg-red-50 border-red-300'
                               : 'bg-amber-50 border-amber-300'
                    : 'bg-emerald-50 border-emerald-300'}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg
                    ${isDiabetic
                      ? sev >= 3 ? 'bg-gradient-to-br from-red-600 to-red-400'
                                 : 'bg-gradient-to-br from-amber-600 to-orange-400'
                      : 'bg-gradient-to-br from-emerald-600 to-teal-400'}`}>
                    {isDiabetic
                      ? <AlertTriangle className="w-8 h-8 text-white" />
                      : <CheckCircle2  className="w-8 h-8 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xl font-black
                      ${isDiabetic ? sev >= 3 ? 'text-red-800' : 'text-amber-800' : 'text-emerald-800'}`}>
                      {isDiabetic
                        ? '⚠ Diabetic Retinopathy Detected'
                        : '✓ No Diabetic Retinopathy Detected'}
                    </p>
                    <p className={`text-sm mt-1 font-medium
                      ${isDiabetic ? sev >= 3 ? 'text-red-700' : 'text-amber-700' : 'text-emerald-700'}`}>
                      {SEVERITY_LABELS[sev]} &nbsp;·&nbsp; Confidence: {conf}%
                    </p>
                    <p className={`text-xs mt-1
                      ${isDiabetic ? sev >= 3 ? 'text-red-600' : 'text-amber-600' : 'text-emerald-600'}`}>
                      {isDiabetic
                        ? sev >= 3
                          ? 'Urgent ophthalmologist referral recommended'
                          : 'Ophthalmologist review recommended'
                        : 'Routine annual screening recommended'}
                    </p>
                  </div>
                  <span className={`badge flex-shrink-0 text-sm
                    ${isDiabetic
                      ? sev >= 3 ? 'badge-urgent'   : 'badge-priority'
                      : 'badge-routine'}`}>
                    {(screening.referral_priority ?? 'routine').toUpperCase()}
                  </span>
                </div>
              );
            })()}

            {/* Three detail cards */}
            <div className="grid md:grid-cols-3 gap-5">

              {/* Quality */}
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Image Quality
                  </h4>
                  {screening.image_quality === 'good'
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <AlertCircle  className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <span className={qualityBadge(screening.image_quality)}>
                    {(screening.image_quality ?? 'unknown').toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Score</span>
                    <span>{((screening.quality_score ?? 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill bg-brand-400"
                      style={{ width: `${(screening.quality_score ?? 0) * 100}%` }} />
                  </div>
                </div>
                {screening.quality_guidance && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {screening.quality_guidance}
                  </p>
                )}
              </div>

              {/* AI Prediction */}
              {screening.predicted_severity != null && (
                <div className="card space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    AI Prediction
                  </h4>
                  <div>
                    <p className="text-xl font-black text-slate-900">
                      {SEVERITY_LABELS[screening.predicted_severity]}
                    </p>
                    <span className={`badge mt-1.5 ${severityClass(screening.predicted_severity)}`}>
                      Severity {screening.predicted_severity}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Confidence</span>
                      <span>{((screening.prediction_confidence ?? 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${confColor(screening.prediction_confidence ?? 0)}`}
                        style={{ width: `${(screening.prediction_confidence ?? 0) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Referral */}
              {screening.referral_priority && (
                <div className={`card space-y-4 ${
                  screening.referral_priority === 'urgent'
                    ? 'border-red-200 bg-red-50/40'
                    : screening.referral_priority === 'priority'
                    ? 'border-amber-200 bg-amber-50/40'
                    : ''}`}>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Referral Priority
                  </h4>
                  <span className={`${priorityBadge(screening.referral_priority)} text-sm`}>
                    {screening.referral_priority.toUpperCase()}
                  </span>
                  {screening.referral_reasoning && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {screening.referral_reasoning}
                    </p>
                  )}
                  {screening.requires_human_review && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      Requires clinical review
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Explanation */}
            {screening.has_explanation && (
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <h4 className="text-sm font-bold text-slate-800">AI Explanation (Grad-CAM)</h4>
                  <span className="badge badge-info ml-auto">XAI</span>
                </div>
                <div className="alert alert-info">
                  <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{screening.explanation_summary}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="card flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-800">Screening Complete</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saved · Screening ID: <span className="font-mono">{screening.id}</span>
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => router.push('/dashboard')} className="btn-secondary flex-1 sm:flex-none">
                  Dashboard
                </button>
                <button onClick={() => router.push(`/screening/${screening.id}`)}
                  className="btn-primary flex-1 sm:flex-none">
                  Full Report <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
