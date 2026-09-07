/**
 * Register patient
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { PatientCreate } from '@/types';
import { UserPlus, AlertCircle, ChevronLeft, ScanEye } from 'lucide-react';

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-slate-100" />
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap px-2">
        {title}
      </span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
    <div className="grid sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

const FIELD = ({
  label, required, hint, full, children,
}: {
  label: string; required?: boolean; hint?: string; full?: boolean; children: React.ReactNode;
}) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <label className="label">
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

export default function RegisterPatient() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState<PatientCreate>({
    patient_id: '', full_name: '', age: 0, gender: 'male',
    phone: '', village_name: '', district: '', state: '',
    has_diabetes: 'yes', diabetes_duration_years: undefined,
    has_hypertension: 'no', previous_eye_exam: 'no',
  });

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({
      ...p,
      [name]: name === 'age' || name === 'diabetes_duration_years'
        ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const p = await api.createPatient(form);
      router.push(`/screening/new?patientId=${p.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Failed to register patient.');
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">

        {/* Header */}
        <div>
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700
                       text-xs font-medium mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-primary-500
                            flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            Register Patient
          </h1>
          <p className="page-sub mt-1">
            Fill in the patient's details to begin DR screening
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={submit} className="card space-y-8">

          <SECTION title="Basic Information">
            <FIELD label="Patient ID" required hint="Unique facility-assigned identifier">
              <input name="patient_id" type="text" className="input"
                value={form.patient_id} onChange={set}
                placeholder="e.g. PHC-2026-001" required />
            </FIELD>
            <FIELD label="Full Name" required>
              <input name="full_name" type="text" className="input"
                value={form.full_name} onChange={set}
                placeholder="Patient's full name" required />
            </FIELD>
            <FIELD label="Age" required>
              <input name="age" type="number" className="input"
                value={form.age || ''} onChange={set}
                placeholder="Age in years" min={1} max={120} required />
            </FIELD>
            <FIELD label="Gender" required>
              <select name="gender" className="input" value={form.gender} onChange={set} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </FIELD>
          </SECTION>

          <SECTION title="Contact & Location">
            <FIELD label="Phone Number">
              <input name="phone" type="tel" className="input"
                value={form.phone} onChange={set} placeholder="Optional" />
            </FIELD>
            <FIELD label="Village / Town">
              <input name="village_name" type="text" className="input"
                value={form.village_name} onChange={set} placeholder="Optional" />
            </FIELD>
            <FIELD label="District">
              <input name="district" type="text" className="input"
                value={form.district} onChange={set} placeholder="Optional" />
            </FIELD>
            <FIELD label="State">
              <input name="state" type="text" className="input"
                value={form.state} onChange={set} placeholder="Optional" />
            </FIELD>
          </SECTION>

          <SECTION title="Medical History">
            <FIELD label="Has Diabetes?">
              <select name="has_diabetes" className="input" value={form.has_diabetes} onChange={set}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unknown">Unknown</option>
              </select>
            </FIELD>
            {form.has_diabetes === 'yes' && (
              <FIELD label="Diabetes Duration (years)">
                <input name="diabetes_duration_years" type="number" className="input"
                  value={form.diabetes_duration_years ?? ''} onChange={set}
                  placeholder="e.g. 5" min={0} />
              </FIELD>
            )}
            <FIELD label="Has Hypertension?">
              <select name="has_hypertension" className="input" value={form.has_hypertension} onChange={set}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unknown">Unknown</option>
              </select>
            </FIELD>
            <FIELD label="Previous Eye Examination?">
              <select name="previous_eye_exam" className="input" value={form.previous_eye_exam} onChange={set}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unknown">Unknown</option>
              </select>
            </FIELD>
          </SECTION>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => router.back()}
              className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Registering…
                </span>
              ) : (
                <><ScanEye className="w-4 h-4" /> Register & Start Screening</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
