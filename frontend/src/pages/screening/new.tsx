/**
 * New screening workflow page - Health Worker interface
 * Complete DR screening pipeline: Image upload → Quality check → AI analysis → Results
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { Patient, Screening, SEVERITY_LABELS, PRIORITY_COLORS, QUALITY_COLORS } from '@/types';
import { 
  Upload, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  Image as ImageIcon,
  AlertTriangle 
} from 'lucide-react';

export default function NewScreening() {
  const router = useRouter();
  const { patientId } = router.query;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [eyeSide, setEyeSide] = useState<'left' | 'right'>('right');
  const [screening, setScreening] = useState<Screening | null>(null);
  
  const [step, setStep] = useState<'upload' | 'uploading' | 'analyzing' | 'results'>('upload');
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId) {
      loadPatient(parseInt(patientId as string));
    }
  }, [patientId]);

  const loadPatient = async (id: number) => {
    try {
      const data = await api.getPatient(id);
      setPatient(data);
    } catch (error) {
      setError('Failed to load patient information');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || !patient) return;

    setError('');
    setStep('uploading');

    try {
      // Step 1: Upload image and create screening
      const newScreening = await api.createScreening(patient.id, eyeSide, selectedFile);
      setScreening(newScreening);

      // Step 2: Run AI analysis
      setStep('analyzing');
      const analyzed = await api.analyzeScreening(newScreening.id);
      setScreening(analyzed);
      setStep('results');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Screening failed. Please try again.');
      setStep('upload');
    }
  };

  if (!patient) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading patient information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="card bg-primary-50 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DR Screening</h1>
              <p className="text-gray-600 mt-1">
                Patient: <span className="font-semibold">{patient.full_name}</span> ({patient.patient_id})
              </p>
            </div>
            <Eye className="h-12 w-12 text-primary-600" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="card space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Capture Retinal Image</h3>
              
              {/* Eye selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Eye
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setEyeSide('left')}
                    className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-colors ${
                      eyeSide === 'left'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Left Eye
                  </button>
                  <button
                    onClick={() => setEyeSide('right')}
                    className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-colors ${
                      eyeSide === 'right'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Right Eye
                  </button>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Fundus Image
                </label>
                {!previewUrl ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Drop image here or click to browse</p>
                    <p className="text-sm text-gray-500 mb-4">JPG, JPEG, PNG (max 10MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="btn-primary cursor-pointer inline-block">
                      Select Image
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        <ImageIcon className="inline h-4 w-4 mr-1" />
                        {selectedFile?.name}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedFile && (
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.back()}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadAndAnalyze}
                  className="btn-primary"
                >
                  Upload & Analyze
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processing Steps */}
        {(step === 'uploading' || step === 'analyzing') && (
          <div className="card text-center py-12">
            <Loader className="animate-spin h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {step === 'uploading' ? 'Uploading Image...' : 'Analyzing Image...'}
            </h3>
            <p className="text-gray-600">
              {step === 'uploading' 
                ? 'Please wait while we upload the retinal image' 
                : 'Running AI screening pipeline: Quality check → DR prediction → Explainability'}
            </p>
            <div className="mt-6 max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && screening && (
          <div className="space-y-6">
            {/* Demo mode warning */}
            {screening.is_demo_mode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">DEMONSTRATION MODE</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This is a synthetic prediction for demonstration purposes. Not for clinical use.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Image Quality */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Quality Assessment</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={`badge ${QUALITY_COLORS[screening.image_quality || 'poor']}`}>
                    {screening.image_quality?.toUpperCase()}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">
                    Quality Score: {((screening.quality_score || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                {screening.image_quality === 'good' ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : screening.image_quality === 'acceptable' ? (
                  <AlertCircle className="h-12 w-12 text-yellow-500" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                )}
              </div>
              
              {screening.quality_guidance && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">{screening.quality_guidance}</p>
                </div>
              )}
            </div>

            {/* DR Prediction */}
            {screening.predicted_severity !== null && screening.predicted_severity !== undefined && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Screening Result</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Predicted Severity</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">
                      {SEVERITY_LABELS[screening.predicted_severity]}
                    </p>
                    <p className="text-sm text-gray-600">
                      Confidence: {((screening.prediction_confidence || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Referral Priority</p>
                    <span className={`inline-block badge text-lg ${PRIORITY_COLORS[screening.referral_priority || 'routine']}`}>
                      {screening.referral_priority?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {screening.referral_reasoning && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Recommendation:</p>
                    <p className="text-sm text-gray-700">{screening.referral_reasoning}</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Explanation */}
            {screening.has_explanation && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Explanation</h3>
                <p className="text-sm text-gray-700 mb-4">{screening.explanation_summary}</p>
                
                {/* Placeholder for heatmap - would show actual image in production */}
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 text-center">
                  <Eye className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Explanation heatmap visualization</p>
                  <p className="text-xs text-gray-500 mt-1">
                    (View full report for detailed visual explanation)
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="card">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">Screening Complete</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Results saved • Screening ID: {screening.id}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn-secondary"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => router.push(`/screening/${screening.id}`)}
                    className="btn-primary"
                  >
                    View Full Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
