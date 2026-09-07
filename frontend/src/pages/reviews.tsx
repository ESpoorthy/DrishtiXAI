/**
 * Reviews page - Clinician interface for pending reviews
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { SEVERITY_LABELS, PRIORITY_COLORS } from '@/types';
import { AlertTriangle, Clock, FileText } from 'lucide-react';

export default function ReviewsPage() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHighPriorityCases();
  }, []);

  const loadHighPriorityCases = async () => {
    try {
      const data = await api.getHighPriorityCases();
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clinical Reviews</h1>
          <p className="text-gray-600 mt-1">Cases requiring urgent attention or clinical review</p>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cases...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No pending reviews</p>
            <p className="text-sm text-gray-500">All high-priority cases have been reviewed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((caseItem) => (
              <div
                key={caseItem.screening_id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/screening/${caseItem.screening_id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {caseItem.patient_name}
                      </h3>
                      <span className={`badge ${PRIORITY_COLORS[caseItem.referral_priority || 'routine']}`}>
                        {caseItem.referral_priority?.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Patient ID</p>
                        <p className="font-medium text-gray-900">{caseItem.patient_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Age / Eye</p>
                        <p className="font-medium text-gray-900">
                          {caseItem.age || 'N/A'} / {caseItem.eye_side}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">AI Prediction</p>
                        <p className="font-medium text-gray-900">
                          {caseItem.severity !== null ? SEVERITY_LABELS[caseItem.severity] : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Confidence</p>
                        <p className="font-medium text-gray-900">
                          {caseItem.confidence ? `${(caseItem.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(caseItem.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1 text-yellow-600" />
                        {caseItem.reason}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button className="btn-primary text-sm">
                      Review Case
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
