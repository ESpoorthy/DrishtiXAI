/**
 * Screening detail + clinician review + PDF download
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { DiabetesStatusBanner } from '@/components/ui/DiabetesStatusBanner';
import { ConfidenceBar } from '@/components/ui/ConfidenceBar';
import { MedicalImage } from '@/components/ui/ImageViewer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  fmtDate, priorityBadge, qualityBadge, severityClass,
} from '@/lib/utils';
import {
  Patient, Screening, SEVERITY_LABELS, ReferralPriority, ClinicianReview,
} from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  Eye, AlertTriangle, CheckCircle2, AlertCircle, ChevronLeft,
  Sparkles, User, Calendar, Activity, ThumbsUp, ThumbsDown,
  Send, Loader2, FileDown, RefreshCw,
} from 'lucide-react';

export default function ScreeningDetail() {
  const router = useRouter();
  const { id }  = router.query;
  const { user } = useAuthStore();

  const [screening,  setScreening]  = useState<Screening | null>(null);
  const [patient,    setPatient]    = useState<Patient | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState('');
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [review, setReview] = useState<ClinicianReview>({
    clinician_agrees:        true,
    clinician_severity:      undefined,
    clinician_notes:         '',
    final_referral_priority: ReferralPriority.ROUTINE,
  });

  const isClinician = user?.role === 'clinician' || user?.role === 'admin';

  useEffect(() => {
    if (id) load(parseInt(id as string));
  }, [id]);

  const load = async (sid: number) => {
    setLoading(true);
    setLoadError('');
    try {
      const s = await api.getScreening(sid);
      setScreening(s);
      const p = await api.getPatient(s.patient_id);
      setPatient(p);
      if (s.predicted_severity != null) {
        setReview(prev => ({
          ...prev,
          clinician_severity:      s.predicted_severity ?? 0,
          final_referral_priority: (s.referral_priority ?? ReferralPriority.ROUTINE) as ReferralPriority,
        }));
      }
    } catch {
      setLoadError('Failed to load screening. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!screening) return;
    setSubmitting(true);
    try {
      await api.submitClinicianReview(screening.id, review);
      await load(screening.id);
      setShowReview(false);
    } catch {
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    if (!screening || !patient) return;
    setPdfLoading(true);
    try {
      const { generateScreeningPDF } = await import('@/lib/pdf');
      const imgUrl = screening.image_path ? api.getScreeningImageUrl(screening.image_path) : null;
      const expUrl = screening.has_explanation && screening.image_path
        ? api.getExplanationImageUrl(screening.image_path) : null;
      await generateScreeningPDF(screening, patient, imgUrl, expUrl);
    } catch (e) {
      console.error('PDF generation failed:', e);
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── States ───────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner fullPage message="Loading screening report…" />;

  if (loadError || !screening || !patient) {
    return (
      <ErrorState
        fullPage
        title="Screening not found"
        message={loadError || 'This screening could not be loaded.'}
        onRetry={() => id && load(parseInt(id as string))}
      />
    );
  }

  const imageUrl = screening.image_path
    ? api.getScreeningImageUrl(screening.image_path) : null;
  const explanationUrl = screening.has_explanation && screening.image_path
    ? api.getExplanationImageUrl(screening.image_path) : null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-up" id="screening-report">

        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* ── Header card ── */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-primary-500
                              flex items-center justify-center text-white font-black text-lg shadow-md">
                {patient.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {patient.patient_id}
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <Eye className="w-3 h-3" /> {screening.eye_side} eye
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {fmtDate(screening.screening_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={priorityBadge(screening.referral_priority)}>
                {(screening.referral_priority ?? 'routine').toUpperCase()}
              </span>
              {screening.is_demo_mode && <span className="badge badge-demo">DEMO</span>}
              <span className="badge badge-neutral capitalize">
                <Activity className="w-3 h-3" />
                {screening.status.replace(/_/g, ' ')}
              </span>

              {/* PDF Download */}
              <button
                onClick={downloadPDF}
                disabled={pdfLoading}
                className="btn-secondary btn-sm flex items-center gap-1.5"
                title="Download PDF Report"
              >
                {pdfLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FileDown className="w-3.5 h-3.5" />}
                {pdfLoading ? 'Generating…' : 'PDF Report'}
              </button>

              <button
                onClick={() => id && load(parseInt(id as string))}
                className="btn-ghost btn-sm btn-icon"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Diabetic status banner ── */}
        {screening.predicted_severity != null && (
          <DiabetesStatusBanner
            severity={screening.predicted_severity}
            confidence={screening.prediction_confidence}
            referralPriority={screening.referral_priority}
            isDemoMode={screening.is_demo_mode}
          />
        )}

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left — images */}
          <div className="lg:col-span-2 space-y-5">

            {/* Fundus image */}
            <MedicalImage
              src={imageUrl}
              alt="Fundus retinal image"
              title="Fundus Image"
              icon="eye"
              subtitle={screening.image_filename}
              downloadName={screening.image_filename}
              badge={
                <span className={qualityBadge(screening.image_quality)}>
                  {(screening.image_quality ?? 'unknown').toUpperCase()}
                </span>
              }
              footer={
                screening.quality_guidance ? (
                  <div className="alert alert-info mt-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p className="text-xs">{screening.quality_guidance}</p>
                  </div>
                ) : undefined
              }
            />

            {/* Grad-CAM */}
            {screening.has_explanation && (
              <MedicalImage
                src={explanationUrl}
                alt="Grad-CAM heatmap"
                title="Grad-CAM Explanation"
                icon="sparkles"
                downloadName={`screening_${screening.id}_gradcam.jpg`}
                badge={<span className="badge badge-info">XAI</span>}
                footer={
                  screening.explanation_summary ? (
                    <div className="alert alert-info mt-4">
                      <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs">{screening.explanation_summary}</p>
                    </div>
                  ) : undefined
                }
              />
            )}
          </div>

          {/* Right — analysis */}
          <div className="space-y-5">

            {/* AI Result */}
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" /> AI Result
              </h3>

              {screening.predicted_severity != null ? (
                <>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Predicted Severity</p>
                    <p className="text-xl font-black text-slate-900">
                      {SEVERITY_LABELS[screening.predicted_severity]}
                    </p>
                    <span className={`badge mt-1.5 ${severityClass(screening.predicted_severity)}`}>
                      Level {screening.predicted_severity}
                    </span>
                  </div>
                  <ConfidenceBar value={screening.prediction_confidence} />
                  {screening.model_version && (
                    <div className="chip text-[11px]">Model: {screening.model_version}</div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Analysis not yet available</p>
              )}
            </div>

            {/* Referral */}
            <div className={`card space-y-3
              ${screening.referral_priority === 'urgent'   ? 'border-red-200 bg-red-50/30'
              : screening.referral_priority === 'priority' ? 'border-amber-200 bg-amber-50/30'
              : ''}`}>
              <h3 className="text-sm font-bold text-slate-800">Referral Recommendation</h3>
              <span className={`${priorityBadge(screening.referral_priority)} text-sm`}>
                {(screening.referral_priority ?? 'routine').toUpperCase()}
              </span>
              {screening.referral_reasoning && (
                <p className="text-xs text-slate-600 leading-relaxed">{screening.referral_reasoning}</p>
              )}
              {screening.requires_human_review && (
                <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold
                                bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Requires clinical review
                </div>
              )}
            </div>

            {/* Clinician review — completed */}
            {screening.status === 'clinician_reviewed' ? (
              <div className="card space-y-4 border-emerald-200 bg-emerald-50/30">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Clinician Reviewed
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded-xl p-3 border border-slate-100">
                    <p className="text-slate-400 mb-1">Agreement</p>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {screening.clinician_agrees
                        ? <><ThumbsUp className="w-3.5 h-3.5 text-emerald-500" /> Agrees</>
                        : <><ThumbsDown className="w-3.5 h-3.5 text-red-500" /> Disagrees</>}
                    </div>
                  </div>
                  {screening.clinician_severity != null && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <p className="text-slate-400 mb-1">Assessment</p>
                      <p className="font-semibold text-slate-800">
                        {SEVERITY_LABELS[screening.clinician_severity]}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Final Referral</p>
                  <span className={priorityBadge(screening.final_referral_priority)}>
                    {(screening.final_referral_priority ?? 'routine').toUpperCase()}
                  </span>
                </div>
                {screening.clinician_notes && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Notes</p>
                    <p className="text-xs text-slate-700 bg-white border border-slate-100 rounded-xl p-3 leading-relaxed">
                      {screening.clinician_notes}
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Reviewed on {fmtDate(screening.review_date)}
                </p>
              </div>

            ) : isClinician ? (
              /* Clinician review form */
              <div className="card space-y-4">
                <button
                  onClick={() => setShowReview(v => !v)}
                  className={showReview ? 'btn-secondary w-full' : 'btn-primary w-full'}
                >
                  {showReview ? 'Cancel Review' : 'Submit Clinical Review'}
                </button>

                {showReview && (
                  <div className="space-y-4 animate-fade-up">
                    <div className="divider" />

                    {/* Agree / Disagree */}
                    <div>
                      <label className="label">Agreement with AI</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([true, false] as const).map(v => (
                          <button key={String(v)} type="button"
                            onClick={() => setReview(r => ({ ...r, clinician_agrees: v }))}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                              ${review.clinician_agrees === v
                                ? v ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-red-500 bg-red-50 text-red-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            {v ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                            {v ? 'Agree' : 'Disagree'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="label">Clinical Assessment</label>
                      <select
                        value={review.clinician_severity ?? ''}
                        onChange={e => setReview(r => ({ ...r, clinician_severity: parseInt(e.target.value) }))}
                        className="input"
                      >
                        {Object.entries(SEVERITY_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="label">Final Referral Priority</label>
                      <select
                        value={review.final_referral_priority}
                        onChange={e => setReview(r => ({ ...r, final_referral_priority: e.target.value as ReferralPriority }))}
                        className="input"
                      >
                        <option value="routine">Routine</option>
                        <option value="priority">Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="label">Clinical Notes</label>
                      <textarea
                        value={review.clinician_notes ?? ''}
                        onChange={e => setReview(r => ({ ...r, clinician_notes: e.target.value }))}
                        className="input resize-none" rows={3}
                        placeholder="Add clinical notes…"
                      />
                    </div>

                    <button onClick={submitReview} disabled={submitting} className="btn-primary w-full">
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Submitting…
                        </span>
                      ) : (
                        <><Send className="w-4 h-4" /> Submit Review</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
