/**
 * Patients list
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { Patient } from '@/types';
import { ErrorBanner } from '@/components/ui/ErrorState';
import { fmtDateShort } from '@/lib/utils';
import { Users, Plus, Search, ScanEye, Calendar, MapPin, Loader2 } from 'lucide-react';

// Local alias for backwards compat
const fmtDate = fmtDateShort;

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [query,    setQuery]    = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setPatients(await api.getPatients()); }
    catch { setError('Failed to load patients. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(query.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(query.toLowerCase()) ||
    (p.district ?? '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-up">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="page-sub">
              {patients.length} patient{patients.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <button onClick={() => router.push('/patients/register')} className="btn-primary">
            <Plus className="w-4 h-4" /> Register Patient
          </button>
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={load} />}

        {/* Search bar */}
        <div className="card py-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input type="text" className="input pl-10"
              placeholder="Search by name, patient ID or district…"
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        {/* Table / states */}
        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-ink-subtle">
            <Users className="w-14 h-14 mb-3 opacity-30" />
            <p className="font-semibold mb-1">
              {query ? 'No matching patients' : 'No patients yet'}
            </p>
            <p className="text-xs mb-6">
              {query ? 'Try a different search term' : 'Register your first patient to get started'}
            </p>
            {!query && (
              <button onClick={() => router.push('/patients/register')} className="btn-primary">
                <Plus className="w-4 h-4" /> Register First Patient
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-surface-muted border-b border-surface-border">
                  <tr>
                    {['Patient', 'ID', 'Age / Gender', 'Location', 'Registered', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="table-row">
                      {/* Patient */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-700
                                          flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {p.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{p.full_name}</p>
                            {p.phone && <p className="text-xs text-slate-400">{p.phone}</p>}
                          </div>
                        </div>
                      </td>
                      {/* ID */}
                      <td className="px-5 py-4">
                        <span className="badge badge-info font-mono text-[11px]">
                          {p.patient_id}
                        </span>
                      </td>
                      {/* Age / Gender */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                        {p.age} yrs · <span className="capitalize">{p.gender}</span>
                      </td>
                      {/* Location */}
                      <td className="px-5 py-4">
                        {(p.village_name || p.district) ? (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {p.village_name ?? p.district}
                            {p.district && p.village_name && `, ${p.district}`}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(p.created_at)}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/screening/new?patientId=${p.id}`)}
                            className="btn-primary btn-sm">
                            <ScanEye className="w-3.5 h-3.5" /> Screen
                          </button>
                          <button
                            onClick={() => router.push(`/patients/${p.id}`)}
                            className="btn-secondary btn-sm">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-surface-border text-xs text-ink-subtle bg-surface-muted">
              Showing {filtered.length} of {patients.length} patients
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
