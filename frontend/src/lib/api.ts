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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const TOKEN_KEY = 'drishti_access_token';
const USER_KEY = 'drishti_user';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000, // 30 s — generous for ML inference
});

// Attach JWT on every request (reads fresh from localStorage each time so a
// token stored after login is immediately picked up)
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

// Redirect to /login on 401 (token expired / invalid)
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

// ---------------------------------------------------------------------------
// Token / session helpers (used by authStore)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

// ── Authentication ──────────────────────────────────────────────────────────

async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>(
    '/auth/login',
    credentials,
  );
  saveSession(data.access_token, data.user);
  return data;
}

function logout(): void {
  clearSession();
}

function getCurrentUser(): User | null {
  return readCurrentUser();
}

// ── Patients ────────────────────────────────────────────────────────────────

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

// ── Screenings ──────────────────────────────────────────────────────────────

/**
 * Upload a fundus image and create a new screening record.
 * Uses multipart/form-data because the backend expects a file upload.
 */
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

/**
 * Trigger the AI analysis pipeline on an already-uploaded screening.
 */
async function analyzeScreening(screeningId: number): Promise<Screening> {
  const { data } = await axiosInstance.post<Screening>(
    `/screenings/${screeningId}/analyze`,
  );
  return data;
}

async function getScreening(screeningId: number): Promise<Screening> {
  const { data } = await axiosInstance.get<Screening>(
    `/screenings/${screeningId}`,
  );
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

/**
 * Build a URL to serve an uploaded fundus image or Grad-CAM heatmap.
 *
 * The backend stores image_path as a relative Windows path like:
 *   data\uploads\1\uuid.jpg
 * The static mount is at /uploads/ → ./data/uploads
 * So we strip "data\uploads\" (or "data/uploads/") and forward-slash the rest.
 *
 *   data\uploads\1\uuid.jpg  →  /uploads/1/uuid.jpg
 */
function imagePathToUrl(storedPath: string): string {
  // Normalise separators → forward slash
  const normalised = storedPath.replace(/\\/g, '/');
  // Strip leading "data/uploads/" prefix if present
  const relative = normalised.replace(/^data\/uploads\/?/, '');
  return `${API_BASE_URL}/uploads/${relative}`;
}

/**
 * Returns the URL for the fundus image using the stored image_path.
 * Falls back to building from filename if path is not available.
 */
function getScreeningImageUrl(imagePath: string): string {
  return imagePathToUrl(imagePath);
}

/**
 * Returns the URL for the Grad-CAM explanation heatmap.
 * Explanation file is stored alongside the original as <stem>_explanation.jpg
 */
function getExplanationImageUrl(imagePath: string): string {
  const url = imagePathToUrl(imagePath);
  // Replace the extension with _explanation.jpg
  return url.replace(/\.[^/.]+$/, '_explanation.jpg');
}

// ── Dashboard & Analytics ────────────────────────────────────────────────────

async function getDashboardStatistics(): Promise<DashboardStatistics> {
  const { data } =
    await axiosInstance.get<DashboardStatistics>('/dashboard/statistics');
  return data;
}

async function getRecentScreenings(limit = 10): Promise<any[]> {
  const { data } = await axiosInstance.get<any[]>(
    '/dashboard/recent-screenings',
    { params: { limit } },
  );
  return data;
}

async function getHighPriorityCases(): Promise<any[]> {
  const { data } = await axiosInstance.get<any[]>(
    '/dashboard/high-priority-cases',
  );
  return data;
}

async function getModelPerformance(): Promise<any> {
  const { data } = await axiosInstance.get<any>(
    '/dashboard/model-performance',
  );
  return data;
}

// ---------------------------------------------------------------------------
// Exported singleton
// ---------------------------------------------------------------------------

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
  submitClinicianReview,
  getScreeningImageUrl,
  getExplanationImageUrl,

  // Dashboard & analytics
  getDashboardStatistics,
  getRecentScreenings,
  getHighPriorityCases,
  getModelPerformance,
};
