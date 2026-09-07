/**
 * TypeScript type definitions for DrishtiXAI
 */

export enum UserRole {
  HEALTH_WORKER = 'health_worker',
  CLINICIAN = 'clinician',
  ADMIN = 'admin',
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  facility_name?: string;
  language_preference: string;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Patient {
  id: number;
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  phone?: string;
  village_name?: string;
  district?: string;
  state?: string;
  has_diabetes?: string;
  diabetes_duration_years?: number;
  has_hypertension?: string;
  previous_eye_exam?: string;
  registered_by: number;
  facility_name?: string;
  created_at: string;
}

export interface PatientCreate {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  phone?: string;
  village_name?: string;
  district?: string;
  state?: string;
  has_diabetes?: string;
  diabetes_duration_years?: number;
  has_hypertension?: string;
  previous_eye_exam?: string;
}

export enum ImageQuality {
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  POOR = 'poor',
}

export enum DRSeverity {
  NO_DR = 0,
  MILD_NPDR = 1,
  MODERATE_NPDR = 2,
  SEVERE_NPDR = 3,
  PROLIFERATIVE_DR = 4,
}

export enum ReferralPriority {
  ROUTINE = 'routine',
  PRIORITY = 'priority',
  URGENT = 'urgent',
}

export enum ScreeningStatus {
  IMAGE_UPLOADED = 'image_uploaded',
  QUALITY_CHECK_FAILED = 'quality_check_failed',
  ANALYZED = 'analyzed',
  CLINICIAN_REVIEWED = 'clinician_reviewed',
  PENDING_SYNC = 'pending_sync',
}

export interface Screening {
  id: number;
  patient_id: number;
  eye_side: string;
  screening_date: string;
  performed_by: number;
  image_filename: string;
  image_path?: string;           // stored path e.g. data\uploads\1\uuid.jpg
  image_quality?: ImageQuality;
  quality_score?: number;
  quality_issues?: string;
  quality_guidance?: string;
  predicted_severity?: number;
  prediction_confidence?: number;
  class_probabilities?: string;
  model_version?: string;
  is_demo_mode: boolean;
  has_explanation: boolean;
  explanation_summary?: string;
  referral_priority?: ReferralPriority;
  referral_reasoning?: string;
  requires_human_review: boolean;
  reviewed_by?: number;
  review_date?: string;
  clinician_agrees?: boolean;
  clinician_severity?: number;
  clinician_notes?: string;
  final_referral_priority?: ReferralPriority;
  status: ScreeningStatus;
  is_synced: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ScreeningCreate {
  patient_id: number;
  eye_side: string;
  image: File;
}

export interface ClinicianReview {
  clinician_agrees: boolean;
  clinician_severity?: number;
  clinician_notes?: string;
  final_referral_priority: ReferralPriority;
}

export interface DashboardStatistics {
  total_screenings: number;
  today_screenings: number;
  high_risk_cases: number;
  urgent_referrals: number;
  poor_quality_images: number;
  pending_reviews: number;
  reviewed_count: number;
  agreement_rate: number;
  severity_distribution: {
    no_dr: number;
    mild: number;
    moderate: number;
    severe: number;
    proliferative: number;
  };
}

export const SEVERITY_LABELS: Record<number, string> = {
  0: 'No DR',
  1: 'Mild NPDR',
  2: 'Moderate NPDR',
  3: 'Severe NPDR',
  4: 'Proliferative DR',
};

export const PRIORITY_COLORS: Record<string, string> = {
  routine: 'text-green-600 bg-green-50',
  priority: 'text-yellow-600 bg-yellow-50',
  urgent: 'text-red-600 bg-red-50',
};

export const QUALITY_COLORS: Record<string, string> = {
  good: 'text-green-600 bg-green-50',
  acceptable: 'text-yellow-600 bg-yellow-50',
  poor: 'text-red-600 bg-red-50',
};
