/**
 * API Client — DrishtiXAI v2 Multi-Disease
 *
 * All backend endpoints, typed and centralised.
 * Auth via JWT Bearer injected on every request.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  AdminSummary,
  AuthResponse,
  ClinicianReview,
  DashboardStatistics,
  LoginCredentials,
  Patient,
  PatientCreate,
  Screening,
  User,
} from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const TOKEN_KEY = 'drishti_access_token';
const USER_KEY  = 'drishti_user';

// ── Axios instance ────────────────────────────────────────────────────────────

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90_000,  // generous for ML inference + PDF generation
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ── Session helpers ───────────────────────────────────────────────────────────

function saveSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
function readCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
  saveSession(data.access_token, data.user);
  return data;
}
function logout(): void { clearSession(); }
function getCurrentUser(): User | null { return readCurrentUser(); }

// ── Patients ──────────────────────────────────────────────────────────────────

async function getPatients(): Promise<Patient[]> {
  const { data } = await axiosInstance.get<Patient[]>('/patients');
  return data;
}
async function getPatient(id: number): Promise<Patient> {
  const { data } = await axiosInstance.get<Patient>(`/patients/${id}`);
  return data;
}
async function createPatient(patientData: PatientCreate): Promise<Patient> {
  const { data } = await axiosInstance.post<Patient>('/patients', patientData);
  return data;
}

// ── Screenings ────────────────────────────────────────────────────────────────

async function createScreening(
  patientId: number,
  eyeSide: 'left' | 'right',
  image: File,
): Promise<Screening> {
  const form = new FormData();
  form.append('patient_id', String(patientId));
  form.append('eye_side', eyeSide);
  form.append('image', image);
  const { data } = await axiosInstance.post<Screening>('/screenings', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
async function analyzeScreening(screeningId: number): Promise<Screening> {
  const { data } = await axiosInstance.post<Screening>(`/screenings/${screeningId}/analyze`);
  return data;
}
async function getScreening(screeningId: number): Promise<Screening> {
  const { data } = await axiosInstance.get<Screening>(`/screenings/${screeningId}`);
  return data;
}
async function getPatientScreenings(patientId: number): Promise<Screening[]> {
  const { data } = await axiosInstance.get<Screening[]>('/screenings', {
    params: { patient_id: patientId, limit: 50 },
  });
  return data;
}
async function submitClinicianReview(
  screeningId: number,
  review: ClinicianReview,
): Promise<Screening> {
  const { data } = await axiosInstance.post<Screening>(
    `/screenings/${screeningId}/review`, review,
  );
  return data;
}

// ── Reports (PDF) ─────────────────────────────────────────────────────────────

/**
 * Download server-generated PDF report for a screening.
 * Triggers browser download directly.
 */
async function downloadPdfReport(screeningId: number, patientId: string): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(
    `${API_BASE_URL}/api/v1/reports/${screeningId}/pdf`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`PDF download failed: ${res.status}`);
  const blob  = await res.blob();
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `DrishtiXAI_Report_${patientId}_${screeningId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Image URL helpers ─────────────────────────────────────────────────────────

/**
 * Convert stored OS path → public static URL.
 *   data\uploads\1\uuid.jpg  →  http://localhost:8000/uploads/1/uuid.jpg
 */
function imagePathToUrl(storedPath: string): string {
  const normalised = storedPath.replace(/\\/g, '/');
  const relative   = normalised.replace(/^data\/uploads\/?/, '');
  return `${API_BASE_URL}/uploads/${relative}`;
}
function getScreeningImageUrl(imagePath: string): string {
  return imagePathToUrl(imagePath);
}
function getExplanationImageUrl(imagePath: string): string {
  return imagePathToUrl(imagePath).replace(/\.[^/.]+$/, '_explanation.jpg');
}

// ── Dashboard & Analytics ─────────────────────────────────────────────────────

async function getDashboardStatistics(): Promise<DashboardStatistics> {
  const { data } = await axiosInstance.get<DashboardStatistics>('/dashboard/statistics');
  return data;
}
async function getRecentScreenings(limit = 10): Promise<any[]> {
  const { data } = await axiosInstance.get<any[]>('/dashboard/recent-screenings', {
    params: { limit },
  });
  return data;
}
async function getHighPriorityCases(): Promise<any[]> {
  const { data } = await axiosInstance.get<any[]>('/dashboard/high-priority-cases');
  return data;
}
async function getModelPerformance(): Promise<any> {
  const { data } = await axiosInstance.get<any>('/dashboard/model-performance');
  return data;
}
async function getAdminSummary(): Promise<AdminSummary> {
  const { data } = await axiosInstance.get<AdminSummary>('/dashboard/admin/summary');
  return data;
}

// ── Export ────────────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login, logout, getCurrentUser,

  // Patients
  getPatients, getPatient, createPatient,

  // Screenings
  createScreening, analyzeScreening, getScreening,
  getPatientScreenings, submitClinicianReview,
  getScreeningImageUrl, getExplanationImageUrl,

  // Reports
  downloadPdfReport,

  // Dashboard
  getDashboardStatistics, getRecentScreenings,
  getHighPriorityCases, getModelPerformance,
  getAdminSummary,
};
