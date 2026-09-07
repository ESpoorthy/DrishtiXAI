/**
 * Screening detail + clinician review
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import {
  Patient, Screening, SEVERITY_LABELS, ReferralPriority,
  ClinicianReview,
} from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  Eye, AlertTriangle, CheckCircle2, AlertCircle,
  ChevronLeft, Sparkles, User, Calendar, Activity,
  ThumbsUp, ThumbsDown, Send, ImageOff, Loader2,
} from 'lucide-react';

/* ── helpers ── */
function priorityBadge(p?: string | null) {
  if (p === 'urgent')   return 'badge badge-urgent';
  if (p === 'priority') return 'badge badge-priority';
  return 'badge badge-routine';
}
function qualityBadge(q?: string | null) {
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
function fmtDate(d?: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }); }
  catch { return '—'; }
}

export default function ScreeningDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [patient,   setPatient]   = useState<Patient | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [imgError,  setImgError]  = useState(false);
  const [expError,  setExpError]  = useState(false);
  const [showReview,setShowReview]= useState(false);
  const [submitting,setSubmitting]= useState(false);

  const [review, setReview] = useState<ClinicianReview>({
    clinician_agrees: true,
    clinician_severity: undefined,
    clinician_notes: '',
    final_referral_priority: ReferralPriority.ROUTINE,
  });

  const isClinician = user?.role === 'clinician' || user?.role === 'admin';

  useEffect(() => {
    if (id) load(parseInt(id as string));
  }, [id]);

  const load = async (sid: number) => {
    try {
      const s = await api.getScreening(sid);
      setScreening(s);
      const p = await api.getPatient(s.patient_id);
      setPatient(p);
      if (s.predicted_severity != null) {
        setReview(prev => ({
          ...prev,
          clinician_severity: s.predicted_severity ?? 0,
          final_referral_priority: (s.referral_priority ?? ReferralPriority.ROUTINE) as ReferralPriority,
        }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submitReview = async () => {
    if (!screening) return;
    setSubmitting(true);
    try {
      await api.submitClinicianReview(screening.id, review);
      await load(screening.id);
      setShowReview(false);
    } catch (e) { console.error(e); alert('Failed to submit review.'); }
    finally { setSubmitting(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
      </div>
    </Layout>
  );

  if (!screening || !patient) return (
    <Layout>
      <div className="card flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertCircle className="w-14 h-14 mb-3 opacity-40" />
        <p className="font-semibold">Screening not found</p>
      </div>
    </Layout>
  );

  const imageUrl       = screening.image_path
    ? api.getScreeningImageUrl(screening.image_path)
    : null;
  const explanationUrl = screening.has_explanation && screening.image_path
    ? api.getExplanationImageUrl(screening.image_path)
    : null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">

        {/* ── Header ── */}
        <div>
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700
                       text-xs font-medium mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-primary-500
                                flex items-center justify-center text-white font-black text-lg shadow-md">
                  {patient.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
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
                {screening.is_demo_mode && (
                  <span className="badge badge-demo">DEMO</span>
                )}
                <span className="badge badge-neutral capitalize">
                  <Activity className="w-3 h-3" /> {screening.status.replace(/_/g,' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Diabetic Status Banner ── */}
        {screening.predicted_severity != null && (
          (() => {
            const isDiabetic = screening.predicted_severity > 0;
            const sev = screening.predicted_severity;
            const conf = ((screening.prediction_confidence ?? 0) * 100).toFixed(1);
            return (
              <div className={`rounded-2xl p-5 border-2 flex items-center gap-5
                ${isDiabetic
                  ? sev >= 3
                    ? 'bg-red-50 border-red-300'
                    : 'bg-amber-50 border-amber-300'
                  : 'bg-emerald-50 border-emerald-300'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md
                  ${isDiabetic
                    ? sev >= 3 ? 'bg-red-500' : 'bg-amber-500'
                    : 'bg-emerald-500'}`}>
                  {isDiabetic
                    ? <AlertTriangle className="w-7 h-7 text-white" />
                    : <CheckCircle2  className="w-7 h-7 text-white" />}
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-black
                    ${isDiabetic ? sev >= 3 ? 'text-red-800' : 'text-amber-800' : 'text-emerald-800'}`}>
                    {isDiabetic
                      ? 'Diabetic Retinopathy Detected'
                      : 'No Diabetic Retinopathy Detected'}
                  </p>
                  <p className={`text-sm mt-0.5
                    ${isDiabetic ? sev >= 3 ? 'text-red-600' : 'text-amber-600' : 'text-emerald-600'}`}>
                    {isDiabetic
                      ? `${SEVERITY_LABELS[sev]} — Confidence: ${conf}% · Referral: ${(screening.referral_priority ?? 'routine').toUpperCase()}`
                      : `No signs of DR found — Confidence: ${conf}% · Routine annual check-up recommended`}
                  </p>
                </div>
                {screening.is_demo_mode && (
                  <span className="badge badge-demo flex-shrink-0">DEMO</span>
                )}
              </div>
            );
          })()
        )}

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left — images */}
          <div className="lg:col-span-2 space-y-5">

            {/* Fundus image */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-brand-500" /> Fundus Image
                </h3>
                <span className={qualityBadge(screening.image_quality)}>
                  {(screening.image_quality ?? 'unknown').toUpperCase()}
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black border border-slate-200 min-h-[220px]
                              flex items-center justify-center">
                {imgError || !imageUrl ? (
                  <div className="flex flex-col items-center gap-2 py-14 text-slate-400">
                    <ImageOff className="w-10 h-10 opacity-40" />
                    <p className="text-xs">Image unavailable</p>
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt="Fundus"
                    className="w-full object-contain max-h-72"
                    onError={() => setImgError(true)}
                  />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-mono">{screening.image_filename}</p>
                {screening.quality_score != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Quality score:</span>
                    <span className="text-xs font-bold text-slate-700">
                      {(screening.quality_score * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              {screening.quality_guidance && (
                <div className="alert alert-info mt-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">{screening.quality_guidance}</p>
                </div>
              )}
            </div>

            {/* Grad-CAM explanation */}
            {screening.has_explanation && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-500" /> Grad-CAM Explanation
                  </h3>
                  <span className="badge badge-info">XAI</span>
                </div>

                <div className="rounded-2xl overflow-hidden bg-black border border-slate-200 min-h-[220px]
                                flex items-center justify-center">
                  {expError || !explanationUrl ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-slate-400">
                      <ImageOff className="w-10 h-10 opacity-40" />
                      <p className="text-xs">Heatmap unavailable</p>
                    </div>
                  ) : (
                    <img
                      src={explanationUrl}
                      alt="Grad-CAM heatmap"
                      className="w-full object-contain max-h-72"
                      onError={() => setExpError(true)}
                    />
                  )}
                </div>

                <div className="alert alert-info mt-4">
                  <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">{screening.explanation_summary}</p>
                </div>
              </div>
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

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Confidence</span>
                      <span className="font-bold">
                        {((screening.prediction_confidence ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${confColor(screening.prediction_confidence ?? 0)}`}
                        style={{ width: `${(screening.prediction_confidence ?? 0) * 100}%` }} />
                    </div>
                  </div>

                  {screening.model_version && (
                    <div className="chip text-[11px]">
                      Model: {screening.model_version}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Analysis not available</p>
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
                <p className="text-xs text-slate-600 leading-relaxed">
                  {screening.referral_reasoning}
                </p>
              )}
              {screening.requires_human_review && (
                <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold
                                bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Requires clinical review
                </div>
              )}
            </div>

            {/* Clinician review — already done */}
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
                    <p className="text-xs text-slate-700 bg-white border border-slate-100
                                  rounded-xl p-3 leading-relaxed">
                      {screening.clinician_notes}
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Reviewed on {fmtDate(screening.review_date)}
                </p>
              </div>
            ) : isClinician && (
              /* Clinician review form */
              <div className="card space-y-4">
                <button onClick={() => setShowReview(v => !v)}
                  className={showReview ? 'btn-secondary w-full' : 'btn-primary w-full'}>
                  {showReview ? 'Cancel Review' : 'Submit Clinical Review'}
                </button>

                {showReview && (
                  <div className="space-y-4 animate-fade-up">
                    <div className="divider" />

                    {/* Agree / Disagree */}
                    <div>
                      <label className="label">Agreement with AI</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[true, false].map(v => (
                          <button key={String(v)} type="button"
                            onClick={() => setReview(r => ({ ...r, clinician_agrees: v }))}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl
                                        border-2 text-sm font-semibold transition-all
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
                        className="input">
                        {Object.entries(SEVERITY_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>

                    {/* Final priority */}
                    <div>
                      <label className="label">Final Referral Priority</label>
                      <select
                        value={review.final_referral_priority}
                        onChange={e => setReview(r => ({ ...r, final_referral_priority: e.target.value as ReferralPriority }))}
                        className="input">
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
                        placeholder="Add clinical notes…" />
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
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
