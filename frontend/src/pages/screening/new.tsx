/**
 * New Screening — Upload → Analyse → Results
 * Fixed: Grad-CAM shown in results, infinite spinner guarded, proper error states
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { DiabetesStatusBanner } from '@/components/ui/DiabetesStatusBanner';
import { ConfidenceBar } from '@/components/ui/ConfidenceBar';
import { MedicalImage } from '@/components/ui/ImageViewer';
import { ErrorBanner } from '@/components/ui/ErrorState';
import { qualityBadge, severityClass, priorityBadge } from '@/lib/utils';
import { Patient, Screening, SEVERITY_LABELS } from '@/types';
import {
  Upload, Eye, AlertCircle, CheckCircle2, Loader2,
  ImageIcon, AlertTriangle, ChevronLeft, Sparkles,
  ScanEye, ArrowRight, RotateCcw, FileText,
} from 'lucide-react';

type Step = 'upload' | 'uploading' | 'analyzing' | 'results';

const STEPS: { id: Step; label: string }[] = [
  { id: 'upload',    label: 'Upload' },
  { id: 'analyzing', label: 'Analyse' },
  { id: 'results',   label: 'Results' },
];

export default function NewScreening() {
  const router = useRouter();
  const { patientId } = router.query;

  const [patient,      setPatient]      = useState<Patient | null>(null);
  const [patientError, setPatientError] = useState('');
  const [patientLoading, setPatientLoading] = useState(true);
  const [file,         setFile]         = useState<File | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [eyeSide,      setEyeSide]      = useState<'left' | 'right'>('right');
  const [screening,    setScreening]    = useState<Screening | null>(null);
  const [step,         setStep]         = useState<Step>('upload');
  const [error,        setError]        = useState('');
  const [dragging,     setDragging]     = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const pid = router.query.patientId;
    if (!pid) {
      setPatientError('No patient selected. Please go back and select a patient.');
      setPatientLoading(false);
      return;
    }
    loadPatient(parseInt(pid as string));
  }, [router.isReady, router.query.patientId]);

  const loadPatient = async (id: number) => {
    setPatientLoading(true);
    setPatientError('');
    try {
      setPatient(await api.getPatient(id));
    } catch {
      setPatientError('Failed to load patient information. Please go back and try again.');
    } finally {
      setPatientLoading(false);
    }
  };

  const processFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file (JPG / PNG).');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.');
      return;
    }
    setFile(f);
    setError('');
    const r = new FileReader();
    r.onloadend = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleAnalyse = async () => {
    if (!file || !patient) return;
    setError('');
    setStep('uploading');
    try {
      const s = await api.createScreening(patient.id, eyeSide, file);
      setScreening(s);
      setStep('analyzing');
      const done = await api.analyzeScreening(s.id);
      setScreening(done);
      setStep('results');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Screening failed. Please try again.');
      setStep('upload');
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setScreening(null);
    setStep('upload'); setError('');
  };

  const currentIdx =
    step === 'uploading' ? 0 : step === 'analyzing' ? 1 : step === 'results' ? 2 : 0;

  // ── Patient loading state ────────────────────────────────────────────────
  if (patientLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-9 h-9 text-brand-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading patient information…</p>
        </div>
      </Layout>
    );
  }

  if (patientError || !patient) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto mt-12 card flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 opacity-60" />
          <p className="font-semibold text-slate-700">
            {patientError || 'Patient not found'}
          </p>
          <button onClick={() => router.push('/patients')} className="btn-primary">
            Back to Patients
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">

        {/* ── Gradient header ── */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-primary-600 p-6 text-white shadow-lg">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-blue-200 hover:text-white text-xs font-medium mb-4 transition-colors"
          >
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
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <ScanEye className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-5">
            {STEPS.map((s, i) => {
              const done   = currentIdx > i;
              const active = currentIdx === i;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                    ${done   ? 'bg-emerald-400 text-white'
                    : active ? 'bg-white text-brand-700 shadow-md scale-110'
                    :          'bg-white/20 text-blue-200'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium
                    ${active ? 'text-white' : done ? 'text-emerald-300' : 'text-blue-300'}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && <div className="w-8 h-px bg-white/25 mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error banner */}
        {error && <ErrorBanner message={error} onRetry={reset} />}

        {/* ═══════════ UPLOAD ═══════════ */}
        {step === 'upload' && (
          <div className="card space-y-6">
            {/* Eye selector */}
            <div>
              <label className="label">Select Eye</label>
              <div className="grid grid-cols-2 gap-3">
                {(['left', 'right'] as const).map(side => (
                  <button key={side} type="button" onClick={() => setEyeSide(side)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all
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
              <label
                htmlFor="file-input"
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-14 cursor-pointer transition-all duration-200
                  ${dragging
                    ? 'border-brand-400 bg-brand-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-brand-300 hover:bg-slate-50'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                  ${dragging ? 'bg-brand-100' : 'bg-slate-100'}`}>
                  <Upload className={`w-8 h-8 transition-colors ${dragging ? 'text-brand-500' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Drag & drop or <span className="text-brand-600">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">JPG, JPEG, PNG · Max 10 MB</p>
                </div>
                <input id="file-input" type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                  <img src={preview} alt="Fundus preview" className="w-full max-h-72 object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <ImageIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white text-xs font-medium truncate max-w-[200px]">{file?.name}</span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="badge badge-good">Ready</span>
                  </div>
                </div>
                <button onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Remove & re-upload
                </button>
              </div>
            )}

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

        {/* ═══════════ PROCESSING ═══════════ */}
        {(step === 'uploading' || step === 'analyzing') && (
          <div className="card flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center">
                <Eye className="w-10 h-10 text-brand-400" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
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
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-primary-400 animate-pulse-soft"
                style={{ width: step === 'uploading' ? '35%' : '75%', transition: 'width 0.5s ease' }}
              />
            </div>
          </div>
        )}

        {/* ═══════════ RESULTS ═══════════ */}
        {step === 'results' && screening && (() => {
          const imgUrl  = screening.image_path ? api.getScreeningImageUrl(screening.image_path) : null;
          const expUrl  = screening.has_explanation && screening.image_path
            ? api.getExplanationImageUrl(screening.image_path) : null;

          return (
            <div className="space-y-5 animate-fade-up">

              {/* Demo banner */}
              {screening.is_demo_mode && (
                <div className="alert alert-warning">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">DEMONSTRATION MODE</p>
                    <p className="text-xs mt-0.5 opacity-80">
                      Image-content-based prediction for demo. Not for clinical use.
                    </p>
                  </div>
                </div>
              )}

              {/* Diabetic status hero */}
              {screening.predicted_severity != null && (
                <DiabetesStatusBanner
                  severity={screening.predicted_severity}
                  confidence={screening.prediction_confidence}
                  referralPriority={screening.referral_priority}
                  isDemoMode={screening.is_demo_mode}
                />
              )}

              {/* Images side by side */}
              {(imgUrl || expUrl) && (
                <div className="grid md:grid-cols-2 gap-5">
                  {imgUrl && (
                    <MedicalImage
                      src={imgUrl}
                      alt="Fundus image"
                      title="Fundus Image"
                      subtitle={screening.image_filename}
                      icon="eye"
                      downloadName={screening.image_filename}
                      badge={
                        <span className={qualityBadge(screening.image_quality)}>
                          {(screening.image_quality ?? 'unknown').toUpperCase()}
                        </span>
                      }
                    />
                  )}
                  {expUrl && screening.has_explanation && (
                    <MedicalImage
                      src={expUrl}
                      alt="Grad-CAM heatmap"
                      title="Grad-CAM Explanation"
                      icon="sparkles"
                      downloadName={`${screening.id}_gradcam.jpg`}
                      badge={<span className="badge badge-info">XAI</span>}
                      footer={
                        screening.explanation_summary ? (
                          <div className="alert alert-info mt-3">
                            <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <p className="text-xs">{screening.explanation_summary}</p>
                          </div>
                        ) : undefined
                      }
                    />
                  )}
                </div>
              )}

              {/* Three detail cards */}
              <div className="grid md:grid-cols-3 gap-5">

                {/* Quality */}
                <div className="card space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Image Quality</h4>
                    {screening.image_quality === 'good'
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      : <AlertCircle  className="w-5 h-5 text-amber-500" />}
                  </div>
                  <span className={qualityBadge(screening.image_quality)}>
                    {(screening.image_quality ?? 'unknown').toUpperCase()}
                  </span>
                  <ConfidenceBar
                    value={screening.quality_score}
                    label="Quality Score"
                  />
                  {screening.quality_guidance && (
                    <p className="text-xs text-slate-500 leading-relaxed">{screening.quality_guidance}</p>
                  )}
                </div>

                {/* AI Prediction */}
                {screening.predicted_severity != null && (
                  <div className="card space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">AI Prediction</h4>
                    <div>
                      <p className="text-xl font-black text-slate-900">
                        {SEVERITY_LABELS[screening.predicted_severity]}
                      </p>
                      <span className={`badge mt-1.5 ${severityClass(screening.predicted_severity)}`}>
                        Severity {screening.predicted_severity}
                      </span>
                    </div>
                    <ConfidenceBar value={screening.prediction_confidence} />
                  </div>
                )}

                {/* Referral */}
                {screening.referral_priority && (
                  <div className={`card space-y-4
                    ${screening.referral_priority === 'urgent' ? 'border-red-200 bg-red-50/40'
                    : screening.referral_priority === 'priority' ? 'border-amber-200 bg-amber-50/40' : ''}`}>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Referral Priority</h4>
                    <span className={`${priorityBadge(screening.referral_priority)} text-sm`}>
                      {screening.referral_priority.toUpperCase()}
                    </span>
                    {screening.referral_reasoning && (
                      <p className="text-xs text-slate-600 leading-relaxed">{screening.referral_reasoning}</p>
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

              {/* Actions */}
              <div className="card flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-800">Screening Complete</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Saved · ID: <span className="font-mono">{screening.id}</span>
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => router.push('/dashboard')} className="btn-secondary flex-1 sm:flex-none">
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push(`/screening/${screening.id}`)}
                    className="btn-primary flex-1 sm:flex-none"
                  >
                    <FileText className="w-4 h-4" /> Full Report
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
