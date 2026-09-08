/**
 * API Client for DrishtiXAI
 *
 * Centralised axios instance with:
 * - Automatic JWT injection via request interceptor
 * - Token persistence in localStorage
 * - Type-safe wrappers for every backend endpoint
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  AuthResponse,
  ClinicianReview,
  DashboardStatistics,
  LoginCredentials,
  Patient,
  PatientCreate,
  Screening,
  User,
} from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const TOKEN_KEY = 'drishti_access_token';
const USER_KEY  = 'drishti_user';

// ── Axios instance ───────────────────────────────────────────────────────────

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000, // 60 s — generous for ML inference + PDF generation
});

// Inject JWT on every request
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Auto-logout on 401
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

// ── Session helpers ──────────────────────────────────────────────────────────

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
  } catch {
    return null;
  }
}

// ── Authentication ───────────────────────────────────────────────────────────

async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
  saveSession(data.access_token, data.user);
  return data;
}

function logout(): void { clearSession(); }
function getCurrentUser(): User | null { return readCurrentUser(); }

// ── Patients ─────────────────────────────────────────────────────────────────

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

// ── Screenings ───────────────────────────────────────────────────────────────

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

/** Fetch all screenings for a specific patient */
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
    `/screenings/${screeningId}/review`,
    review,
  );
  return data;
}

// ── Image URL helpers ────────────────────────────────────────────────────────

/**
 * Convert stored OS path to a public static URL.
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

// ── Dashboard & Analytics ────────────────────────────────────────────────────

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

// ── Export ───────────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login,
  logout,
  getCurrentUser,

  // Patients
  getPatients,
  getPatient,
  createPatient,

  // Screenings
  createScreening,
  analyzeScreening,
  getScreening,
  getPatientScreenings,
  submitClinicianReview,
  getScreeningImageUrl,
  getExplanationImageUrl,

  // Dashboard & analytics
  getDashboardStatistics,
  getRecentScreenings,
  getHighPriorityCases,
  getModelPerformance,
};
