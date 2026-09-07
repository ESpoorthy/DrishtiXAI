/**
 * Main dashboard page
 */
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { DashboardStatistics } from '@/types';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp 
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [recentScreenings, setRecentScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, recentData] = await Promise.all([
        api.getDashboardStatistics(),
        api.getRecentScreenings(5),
      ]);
      setStats(statsData);
      setRecentScreenings(recentData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
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
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Total Screenings',
      value: stats?.total_screenings || 0,
      icon: Activity,
      color: 'bg-blue-500',
    },
    {
      title: "Today's Screenings",
      value: stats?.today_screenings || 0,
      icon: Clock,
      color: 'bg-green-500',
    },
    {
      title: 'High Risk Cases',
      value: stats?.high_risk_cases || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Pending Reviews',
      value: stats?.pending_reviews || 0,
      icon: CheckCircle,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of screening activities</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts and recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Severity Distribution
            </h3>
            <div className="space-y-3">
              {stats && [
                { label: 'No DR', value: stats.severity_distribution.no_dr, color: 'bg-green-500' },
                { label: 'Mild NPDR', value: stats.severity_distribution.mild, color: 'bg-yellow-400' },
                { label: 'Moderate NPDR', value: stats.severity_distribution.moderate, color: 'bg-orange-500' },
                { label: 'Severe NPDR', value: stats.severity_distribution.severe, color: 'bg-red-500' },
                { label: 'Proliferative DR', value: stats.severity_distribution.proliferative, color: 'bg-red-700' },
              ].map((item) => {
                const total = stats.total_screenings || 1;
                const percentage = (item.value / total) * 100;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-600">{item.value} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent screenings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Screenings
            </h3>
            <div className="space-y-3">
              {recentScreenings.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent screenings</p>
              ) : (
                recentScreenings.map((screening) => (
                  <div
                    key={screening.screening_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{screening.patient_name}</p>
                      <p className="text-xs text-gray-500">
                        {screening.eye_side} eye • {new Date(screening.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${
                        screening.referral_priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        screening.referral_priority === 'priority' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {screening.referral_priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Performance metrics */}
        {stats && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              System Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Agreement Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.agreement_rate}%</p>
                <p className="text-xs text-gray-500 mt-1">Clinician-AI agreement</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Poor Quality Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((stats.poor_quality_images / stats.total_screenings) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Images requiring recapture</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Urgent Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent_referrals}</p>
                <p className="text-xs text-gray-500 mt-1">Cases requiring immediate attention</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
