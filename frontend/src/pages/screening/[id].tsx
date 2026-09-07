/**
 * Screening detail and clinician review page
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { Patient, Screening, SEVERITY_LABELS, PRIORITY_COLORS, QUALITY_COLORS, ClinicianReview } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { 
  Eye, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

export default function ScreeningDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  
  const [screening, setScreening] = useState<Screening | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const [review, setReview] = useState<ClinicianReview>({
    clinician_agrees: true,
    clinician_severity: undefined,
    clinician_notes: '',
    final_referral_priority: 'routine',
  });
  const [submitting, setSubmitting] = useState(false);

  const isClinician = user?.role === 'clinician' || user?.role === 'admin';

  useEffect(() => {
    if (id) {
      loadScreening(parseInt(id as string));
    }
  }, [id]);

  const loadScreening = async (screeningId: number) => {
    try {
      const screeningData = await api.getScreening(screeningId);
      setScreening(screeningData);

      // Load patient info
      const patientData = await api.getPatient(screeningData.patient_id);
      setPatient(patientData);

      // Pre-fill review form
      if (screeningData.predicted_severity !== null) {
        setReview((prev) => ({
          ...prev,
          clinician_severity: screeningData.predicted_severity || 0,
          final_referral_priority: screeningData.referral_priority || 'routine',
        }));
      }
    } catch (error) {
      console.error('Failed to load screening:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!screening) return;

    setSubmitting(true);
    try {
      await api.submitClinicianReview(screening.id, review);
      // Reload screening
      await loadScreening(screening.id);
      setShowReviewForm(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading screening details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!screening || !patient) {
    return (
      <Layout>
        <div className="card text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Screening not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="card bg-primary-50 border border-primary-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Screening Report</h1>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-semibold ml-2">{patient.full_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Patient ID:</span>
                  <span className="font-semibold ml-2">{patient.patient_id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Eye:</span>
                  <span className="font-semibold ml-2 capitalize">{screening.eye_side}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold ml-2">
                    {new Date(screening.screening_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`badge ${PRIORITY_COLORS[screening.referral_priority || 'routine']}`}>
                {screening.referral_priority?.toUpperCase()}
              </span>
              {screening.is_demo_mode && (
                <div className="mt-2">
                  <span className="badge bg-yellow-100 text-yellow-800 text-xs">DEMO MODE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Image */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fundus Image</h3>
              <div className="bg-gray-100 border border-gray-300 rounded-lg overflow-hidden">
                {/* In production, would load actual image via api.getScreeningImageUrl */}
                <div className="aspect-video flex items-center justify-center">
                  <Eye className="h-24 w-24 text-gray-400" />
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">{screening.image_filename}</p>
                <span className={`badge ${QUALITY_COLORS[screening.image_quality || 'poor']}`}>
                  Quality: {screening.image_quality?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* AI Explanation */}
            {screening.has_explanation && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Explanation (Grad-CAM)</h3>
                <div className="bg-gray-100 border border-gray-300 rounded-lg overflow-hidden mb-4">
                  <div className="aspect-video flex items-center justify-center">
                    <Eye className="h-24 w-24 text-gray-400" />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Model Attention Summary:</p>
                  <p className="text-sm text-blue-800">{screening.explanation_summary}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Analysis Results */}
          <div className="space-y-6">
            {/* AI Prediction */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Screening Result</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Predicted Severity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {screening.predicted_severity !== null 
                      ? SEVERITY_LABELS[screening.predicted_severity]
                      : 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Confidence</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full ${
                          (screening.prediction_confidence || 0) >= 0.8 ? 'bg-green-500' :
                          (screening.prediction_confidence || 0) >= 0.6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(screening.prediction_confidence || 0) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {((screening.prediction_confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Model Version</p>
                  <p className="text-sm font-mono text-gray-700">{screening.model_version}</p>
                </div>
              </div>
            </div>

            {/* Referral Recommendation */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Recommendation</h3>
              <div className="space-y-3">
                <div>
                  <span className={`badge text-base ${PRIORITY_COLORS[screening.referral_priority || 'routine']}`}>
                    {screening.referral_priority?.toUpperCase()}
                  </span>
                </div>
                {screening.referral_reasoning && (
                  <p className="text-sm text-gray-700">{screening.referral_reasoning}</p>
                )}
                {screening.requires_human_review && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">Requires clinical review</p>
                  </div>
                )}
              </div>
            </div>

            {/* Clinician Review */}
            {screening.status === 'clinician_reviewed' ? (
              <div className="card bg-green-50 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  Clinician Reviewed
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Agreement with AI:</p>
                    <p className="font-semibold text-gray-900">
                      {screening.clinician_agrees ? 'Agrees' : 'Disagrees'}
                    </p>
                  </div>
                  {screening.clinician_severity !== null && screening.clinician_severity !== undefined && (
                    <div>
                      <p className="text-gray-600">Clinician Assessment:</p>
                      <p className="font-semibold text-gray-900">
                        {SEVERITY_LABELS[screening.clinician_severity]}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Final Referral:</p>
                    <span className={`badge ${PRIORITY_COLORS[screening.final_referral_priority || 'routine']}`}>
                      {screening.final_referral_priority?.toUpperCase()}
                    </span>
                  </div>
                  {screening.clinician_notes && (
                    <div>
                      <p className="text-gray-600">Notes:</p>
                      <p className="text-gray-900 mt-1">{screening.clinician_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : isClinician && (
              <div className="card">
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="w-full btn-primary"
                >
                  {showReviewForm ? 'Cancel Review' : 'Submit Clinical Review'}
                </button>

                {showReviewForm && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Do you agree with AI assessment?
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setReview({ ...review, clinician_agrees: true })}
                          className={`flex-1 py-2 px-4 border-2 rounded-lg font-medium ${
                            review.clinician_agrees
                              ? 'border-green-600 bg-green-50 text-green-700'
                              : 'border-gray-300 text-gray-700'
                          }`}
                        >
                          Agree
                        </button>
                        <button
                          onClick={() => setReview({ ...review, clinician_agrees: false })}
                          className={`flex-1 py-2 px-4 border-2 rounded-lg font-medium ${
                            !review.clinician_agrees
                              ? 'border-red-600 bg-red-50 text-red-700'
                              : 'border-gray-300 text-gray-700'
                          }`}
                        >
                          Disagree
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinical Assessment
                      </label>
                      <select
                        value={review.clinician_severity || ''}
                        onChange={(e) => setReview({ ...review, clinician_severity: parseInt(e.target.value) })}
                        className="input"
                      >
                        {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Final Referral Priority
                      </label>
                      <select
                        value={review.final_referral_priority}
                        onChange={(e) => setReview({ ...review, final_referral_priority: e.target.value as any })}
                        className="input"
                      >
                        <option value="routine">Routine</option>
                        <option value="priority">Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinical Notes
                      </label>
                      <textarea
                        value={review.clinician_notes}
                        onChange={(e) => setReview({ ...review, clinician_notes: e.target.value })}
                        className="input"
                        rows={4}
                        placeholder="Enter clinical notes..."
                      />
                    </div>

                    <button
                      onClick={handleSubmitReview}
                      disabled={submitting}
                      className="w-full btn-primary"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
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
