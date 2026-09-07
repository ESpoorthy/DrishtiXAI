/**
 * Analytics page - Model performance and system metrics
 */
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { TrendingUp, Activity, Target, AlertCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      const data = await api.getModelPerformance();
      setPerformance(data);
    } catch (error) {
      console.error('Failed to load performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Performance</h1>
          <p className="text-gray-600 mt-1">AI model performance and operational metrics</p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                {performance?.note}
              </p>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Predictions</p>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{performance?.total_predictions || 0}</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {((performance?.average_confidence || 0) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Agreement Rate</p>
              <TrendingUp className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {performance?.clinician_review?.agreement_rate || 0}%
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Cases Reviewed</p>
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {performance?.clinician_review?.reviewed || 0}
            </p>
          </div>
        </div>

        {/* Confidence distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Confidence Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">High Confidence (≥80%)</span>
                <span className="font-medium text-gray-900">
                  {performance?.confidence_distribution?.high || 0} predictions
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: `${
                      ((performance?.confidence_distribution?.high || 0) /
                        (performance?.total_predictions || 1)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Medium Confidence (60-80%)</span>
                <span className="font-medium text-gray-900">
                  {performance?.confidence_distribution?.medium || 0} predictions
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{
                    width: `${
                      ((performance?.confidence_distribution?.medium || 0) /
                        (performance?.total_predictions || 1)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Low Confidence (&lt;60%)</span>
                <span className="font-medium text-gray-900">
                  {performance?.confidence_distribution?.low || 0} predictions
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{
                    width: `${
                      ((performance?.confidence_distribution?.low || 0) /
                        (performance?.total_predictions || 1)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Image quality distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Quality Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-green-100 rounded-lg p-6 mb-2">
                <p className="text-3xl font-bold text-green-700">
                  {performance?.quality_distribution?.good || 0}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">Good Quality</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 rounded-lg p-6 mb-2">
                <p className="text-3xl font-bold text-yellow-700">
                  {performance?.quality_distribution?.acceptable || 0}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">Acceptable</p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 rounded-lg p-6 mb-2">
                <p className="text-3xl font-bold text-red-700">
                  {performance?.quality_distribution?.poor || 0}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">Poor Quality</p>
            </div>
          </div>
        </div>

        {/* Clinician review stats */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinician Review Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cases Reviewed</p>
              <p className="text-2xl font-bold text-gray-900">
                {performance?.clinician_review?.reviewed || 0}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Agreed with AI</p>
              <p className="text-2xl font-bold text-green-600">
                {performance?.clinician_review?.agreed || 0}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Disagreed with AI</p>
              <p className="text-2xl font-bold text-red-600">
                {performance?.clinician_review?.disagreed || 0}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Overall Agreement Rate</p>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${performance?.clinician_review?.agreement_rate || 0}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {performance?.clinician_review?.agreement_rate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
