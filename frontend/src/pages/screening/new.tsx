/**
 * New Screening — Upload → Analyse → Results
 *
 * Three-step flow:
 *   1. Upload: eye selection + drag-and-drop image upload
 *   2. Processing: sequential status indicators
 *   3. Results: three-state result (normal / abnormal / uncertain)
 *               + image quality, confidence, Grad-CAM, referral
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { ScreeningResultBanner } from '@/components/ui/ScreeningResultBanner';
import { ConfidenceBar } from '@/components/ui/ConfidenceBar';
import { MedicalImage } from '@/components/ui/ImageViewer';
import { ErrorBanner } from '@/components/ui/ErrorState';
import { priorityBadge, qualityBadge, severityClass, confPct } from '@/lib/utils';
import { Patient, Screening, SEVERITY_LABELS, ScreeningStatus } from '@/types';
import {
  Upload, Eye, AlertCircle, CheckCircle2, Loader2,
  ImageIcon, AlertTriangle, ChevronLeft, ScanEye,
  ArrowRight, RotateCcw, FileText, Activity,
  ShieldCheck, Sparkles,
} from 'lucide-react';

type Step = 'upload' | 'uploading' | 'analyzing' | 'results';

const STEPS = [
  { id: 'upload'    as Step, label: 'Upload'  },
  { id: 'analyzing' as Step, label: 'Analyse' },
  { id: 'results'   as Step, label: 'Results' },
];

export default function NewScreening() {
  const router = useRouter();

  const [patient,       setPatient]       = useState<Patient | null>(null);
  const [patientError,  setPatientError]  = useState('');
  const [patientLoading, setPatientLoading] = useState(true);
  const [file,          setFile]          = useState<File | null>(null);
  const [preview,       setPreview]       = useState<string | null>(null);
  const [eyeSide,       setEyeSide]       = useState<'left' | 'right'>('right');
  const [screening,     setScreening]     = useState<Screening | null>(null);
  const [step,          setStep]          = useState<Step>('upload');
  const [error,         setError]         = useState('');
  const [dragging,      setDragging]      = useState(false);

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
      setError('Please select a JPG or PNG image file.');
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
      setError(
        err.response?.data?.detail ??
        'Screening could not be completed. Please try again.'
      );
      setStep('upload');
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setScreening(null);
    setStep('upload'); setError('');
  };

  const currentIdx =
    step === 'uploading' ? 0 :
    step === 'analyzing' ? 1 :
    step === 'results'   ? 2 : 0;

  // ── Loading / error states ───────────────────────────────────────────
  if (patientLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm text-ink-muted">Loading patient…</p>
        </div>
      </Layout>
    );
  }

  if (patientError || !patient) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-12 card flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 opacity-60" />
          <p className="font-semibold text-ink">{patientError || 'Patient not found'}</p>
          <button onClick={() => router.push('/patients')} className="btn-primary">
            Back to Patients
          </button>
        </div>
      </Layout>
    );
  }

  const isQualityFailed = screening?.status === ScreeningStatus.QUALITY_CHECK_FAILED;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-5 animate-fade-up">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-ink-subtle hover:text-ink
                         text-xs font-medium mb-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="page-title flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center">
                <ScanEye className="w-4 h-4 text-white" />
              </div>
              Retinal Screening
            </h1>
            <p className="page-sub">
              {patient.full_name}
              <span className="ml-2 font-mono text-xs text-ink-subtle">#{patient.patient_id}</span>
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const done   = currentIdx > i;
              const active = currentIdx === i;
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className={
                    done   ? 'step-done' :
                    active ? 'step-active' :
                             'step-inactive'
                  }>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block
                    ${active ? 'text-teal-700' : done ? 'text-emerald-600' : 'text-ink-subtle'}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="w-6 h-px bg-surface-border mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Error ── */}
        {error && <ErrorBanner message={error} onRetry={reset} />}

        {/* ═══════════════ UPLOAD ═══════════════ */}
        {step === 'upload' && (
          <div className="card space-y-6">

            {/* Eye selector */}
            <fieldset>
              <legend className="label mb-3">Select eye to screen</legend>
              <div className="grid grid-cols-2 gap-3">
                {(['left', 'right'] as const).map(side => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setEyeSide(side)}
                    aria-pressed={eyeSide === side}
                    className={`flex items-center justify-center gap-2.5 py-4 rounded-xl border-2
                                font-semibold text-sm transition-all
                      ${eyeSide === side
                        ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-surface-border text-ink-muted hover:border-teal-300 hover:bg-teal-50/50'}`}
                  >
                    <Eye className="w-4 h-4" />
                    {side.charAt(0).toUpperCase() + side.slice(1)} Eye
                    {eyeSide === side && (
                      <span className="ml-1 text-[10px] font-bold text-teal-600 uppercase tracking-wide">
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-subtle mt-2 flex items-center gap-1.5">
                <Activity className="w-3 h-3" />
                {eyeSide === 'left' ? 'Left' : 'Right'} eye selected — this will be recorded with the screening result
              </p>
            </fieldset>

            <div className="divider" />

            {/* Upload zone / preview */}
            {!preview ? (
              <div>
                <label htmlFor="file-input" className="label mb-3">
                  Upload retinal / fundus image
                </label>
                <label
                  htmlFor="file-input"
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed
                              rounded-2xl p-12 cursor-pointer transition-all duration-200
                    ${dragging
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-surface-border hover:border-teal-300 hover:bg-teal-50/30'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                                   transition-colors ${dragging ? 'bg-teal-100' : 'bg-surface-subtle'}`}>
                    <Upload className={`w-7 h-7 transition-colors
                      ${dragging ? 'text-teal-600' : 'text-ink-subtle'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-ink">
                      {dragging ? 'Drop to upload' : <>Drag & drop or <span className="text-teal-700">browse</span></>}
                    </p>
                    <p className="text-xs text-ink-muted mt-1">JPG, JPEG, PNG · Max 10 MB</p>
                    <p className="text-xs text-ink-subtle mt-1">
                      A retinal/fundus photograph is required for analysis
                    </p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Upload fundus image"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="label">Image preview</p>
                <div className="relative rounded-2xl overflow-hidden border border-surface-border bg-ink/5">
                  <img
                    src={preview}
                    alt="Fundus image preview"
                    className="w-full max-h-72 object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-white text-xs font-medium truncate max-w-[200px]">
                      {file?.name}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="badge badge-teal text-xs">Ready</span>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700
                             font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Remove and re-upload
                </button>
              </div>
            )}

            {/* Action buttons */}
            {file && (
              <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                <button onClick={() => router.back()} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleAnalyse} className="btn-primary">
                  <ScanEye className="w-4 h-4" />
                  Upload &amp; Analyse
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ PROCESSING ═══════════════ */}
        {(step === 'uploading' || step === 'analyzing') && (
          <div className="card flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center">
                <Eye className="w-10 h-10 text-teal-400" />
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-teal-200 border-t-teal-600 animate-spin" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-ink">
                {step === 'uploading' ? 'Uploading image…' : 'Running AI pipeline…'}
              </h3>
              <p className="text-ink-muted text-sm mt-1 max-w-xs">
                {step === 'uploading'
                  ? 'Securely saving fundus image'
                  : 'Quality check → Modality check → AI prediction → Grad-CAM → Referral triage'}
              </p>
            </div>

            {/* Sequential status steps */}
            <div className="w-full max-w-xs space-y-2 mt-2">
              {[
                { label: 'Image upload',         done: true },
                { label: 'Retinal image check',  done: step === 'analyzing' },
                { label: 'Quality assessment',   done: step === 'analyzing' },
                { label: 'AI prediction',        done: false },
                { label: 'Grad-CAM explanation', done: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  {s.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0
                      ${i === (step === 'analyzing' ? 3 : 2)
                        ? 'border-teal-500 border-t-transparent animate-spin'
                        : 'border-surface-border'}`} />
                  )}
                  <span className={s.done ? 'text-emerald-700 font-medium' : 'text-ink-subtle'}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ RESULTS ═══════════════ */}
        {step === 'results' && screening && (() => {
          const imgUrl = screening.image_path
            ? api.getScreeningImageUrl(screening.image_path) : null;
          const expUrl = screening.has_explanation && screening.image_path
            ? api.getExplanationImageUrl(screening.image_path) : null;

          return (
            <div className="space-y-5 animate-fade-up">

              {/* Demo mode banner */}
              {screening.is_demo_mode && (
                <div className="alert alert-warning">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Demonstration Mode Active</p>
                    <p className="text-xs mt-0.5">
                      This result is produced by a pixel-analysis heuristic for demonstration.
                      It is not a trained validated DR classifier and must not be used clinically.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Primary result banner ── */}
              <ScreeningResultBanner
                severity={screening.predicted_severity}
                confidence={screening.prediction_confidence}
                referralPriority={screening.referral_priority}
                isDemoMode={screening.is_demo_mode}
                isUncertain={isQualityFailed}
                qualityGuidance={isQualityFailed ? screening.quality_guidance : undefined}
              />

              {/* ── Images ── */}
              {!isQualityFailed && (
                <div className="grid md:grid-cols-2 gap-5">
                  <MedicalImage
                    src={imgUrl}
                    alt={`${eyeSide} eye fundus retinal image`}
                    title="Fundus Image"
                    icon="eye"
                    subtitle={screening.image_filename}
                    downloadName={screening.image_filename}
                    badge={
                      <span className={qualityBadge(screening.image_quality)}>
                        {(screening.image_quality ?? 'unknown').toUpperCase()}
                      </span>
                    }
                  />

                  {screening.has_explanation ? (
                    <MedicalImage
                      src={expUrl}
                      alt="Grad-CAM attention heatmap"
                      title="AI Explanation (Grad-CAM)"
                      icon="sparkles"
                      downloadName={`screening_${screening.id}_gradcam.jpg`}
                      badge={<span className="badge badge-info">XAI</span>}
                      footer={
                        screening.explanation_summary ? (
                          <div className="alert alert-info">
                            <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p className="text-xs">{screening.explanation_summary}</p>
                          </div>
                        ) : undefined
                      }
                    />
                  ) : (
                    <div className="card flex items-center justify-center min-h-[200px]">
                      <div className="text-center text-ink-subtle">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Grad-CAM explanation not available</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Detail row ── */}
              {!isQualityFailed && (
                <div className="grid sm:grid-cols-3 gap-4">

                  {/* Image quality */}
                  <div className="card space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                        Image Quality
                      </p>
                    </div>
                    <span className={qualityBadge(screening.image_quality)}>
                      {(screening.image_quality ?? 'unknown').toUpperCase()}
                    </span>
                    {screening.quality_score != null && (
                      <ConfidenceBar
                        value={screening.quality_score}
                        label="Quality score"
                        height="sm"
                      />
                    )}
                    {screening.quality_issues && (() => {
                      try {
                        const issues: string[] = JSON.parse(screening.quality_issues);
                        return issues.length > 0 ? (
                          <ul className="space-y-1">
                            {issues.map((iss, i) => (
                              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                {iss}
                              </li>
                            ))}
                          </ul>
                        ) : null;
                      } catch { return null; }
                    })()}
                  </div>

                  {/* AI prediction */}
                  <div className="card space-y-3">
                    <div className="flex items-center gap-2">
                      <ScanEye className="w-4 h-4 text-teal-600" />
                      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                        AI Prediction
                      </p>
                    </div>
                    {screening.predicted_severity != null ? (
                      <>
                        <p className="text-base font-bold text-ink">
                          {SEVERITY_LABELS[screening.predicted_severity]}
                        </p>
                        <span className={`badge ${severityClass(screening.predicted_severity)}`}>
                          Level {screening.predicted_severity}
                        </span>
                        <ConfidenceBar
                          value={screening.prediction_confidence}
                          showNote
                          height="sm"
                        />
                        {screening.requires_human_review && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700
                                          font-medium bg-amber-50 border border-amber-200
                                          rounded-lg px-2.5 py-1.5">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            Requires clinical review
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-ink-muted">Not available</p>
                    )}
                  </div>

                  {/* Referral */}
                  <div className={`card space-y-3
                    ${screening.referral_priority === 'urgent'   ? 'border-red-200 bg-red-50/20'
                    : screening.referral_priority === 'priority' ? 'border-amber-200 bg-amber-50/20'
                    : ''}`}>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-600" />
                      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                        Referral Priority
                      </p>
                    </div>
                    <span className={priorityBadge(screening.referral_priority)}>
                      {(screening.referral_priority ?? 'routine').toUpperCase()}
                    </span>
                    {screening.referral_reasoning && (
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {screening.referral_reasoning}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Grad-CAM legend ── */}
              {screening.has_explanation && !isQualityFailed && (
                <div className="card-muted p-4">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                    Grad-CAM Attention Map — Legend
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-3 rounded-full"
                        style={{ background: 'linear-gradient(to right, #1e3a8a, #06b6d4, #22c55e, #eab308, #ef4444)' }} />
                    </div>
                    <div className="flex items-center justify-between flex-1 text-xs text-ink-subtle">
                      <span>Low attention</span>
                      <span>High attention</span>
                    </div>
                  </div>
                  <p className="text-xs text-ink-subtle mt-2">
                    Highlighted regions show image areas that contributed to this prediction.
                    This is not a clinical lesion map — warm colours (red/yellow) indicate
                    higher model attention, not confirmed pathology.
                  </p>
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3
                              pt-4 border-t border-surface-border">
                <button onClick={reset} className="btn-secondary w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4" /> New Screening
                </button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn-ghost flex-1 sm:flex-none"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push(`/screening/${screening.id}`)}
                    className="btn-primary flex-1 sm:flex-none"
                  >
                    <FileText className="w-4 h-4" /> Full Report
                    <ArrowRight className="w-3.5 h-3.5" />
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
