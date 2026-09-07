/**
 * Patient registration page - Health Worker interface
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { PatientCreate } from '@/types';
import { UserPlus, AlertCircle } from 'lucide-react';

export default function RegisterPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<PatientCreate>({
    patient_id: '',
    full_name: '',
    age: 0,
    gender: 'male',
    phone: '',
    village_name: '',
    district: '',
    state: '',
    has_diabetes: 'yes',
    diabetes_duration_years: undefined,
    has_hypertension: 'no',
    previous_eye_exam: 'no',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'diabetes_duration_years' 
        ? value ? parseInt(value) : undefined 
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const patient = await api.createPatient(formData);
      // Redirect to screening page
      router.push(`/screening/new?patientId=${patient.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <UserPlus className="h-8 w-8 mr-3" />
            Register New Patient
          </h1>
          <p className="text-gray-600 mt-1">Enter patient information for screening</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter unique patient ID"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Facility-assigned identifier</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder="Age in years"
                  min="0"
                  max="120"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Village/Town
                </label>
                <input
                  type="text"
                  name="village_name"
                  value={formData.village_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="input"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="input"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Medical History (for risk assessment)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Diabetes?
                </label>
                <select
                  name="has_diabetes"
                  value={formData.has_diabetes}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              {formData.has_diabetes === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diabetes Duration (years)
                  </label>
                  <input
                    type="number"
                    name="diabetes_duration_years"
                    value={formData.diabetes_duration_years || ''}
                    onChange={handleChange}
                    className="input"
                    placeholder="Optional"
                    min="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Hypertension?
                </label>
                <select
                  name="has_hypertension"
                  value={formData.has_hypertension}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Eye Examination?
                </label>
                <select
                  name="previous_eye_exam"
                  value={formData.previous_eye_exam}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register & Proceed to Screening'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
