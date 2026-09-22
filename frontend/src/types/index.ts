/**
 * TypeScript type definitions for DrishtiXAI — v2 Multi-Disease
 */

export enum UserRole {
  HEALTH_WORKER = 'health_worker',
  CLINICIAN     = 'clinician',
  ADMIN         = 'admin',
}

export interface User {
  id:                  number;
  email:               string;
  username:            string;
  full_name:           string;
  role:                UserRole;
  is_active:           boolean;
  facility_name?:      string;
  language_preference: string;
  created_at:          string;
}

export interface LoginCredentials { username: string; password: string; }

export interface AuthResponse {
  access_token: string;
  token_type:   string;
  user:         User;
}

export interface Patient {
  id:                      number;
  patient_id:              string;
  full_name:               string;
  age:                     number;
  gender:                  string;
  phone?:                  string;
  village_name?:           string;
  district?:               string;
  state?:                  string;
  has_diabetes?:           string;
  diabetes_duration_years?: number;
  has_hypertension?:       string;
  previous_eye_exam?:      string;
  family_history_glaucoma?: string;
  registered_by:           number;
  facility_name?:          string;
  created_at:              string;
}

export interface PatientCreate {
  patient_id:               string;
  full_name:                string;
  age:                      number;
  gender:                   string;
  phone?:                   string;
  village_name?:            string;
  district?:                string;
  state?:                   string;
  has_diabetes?:            string;
  diabetes_duration_years?: number;
  has_hypertension?:        string;
  previous_eye_exam?:       string;
  family_history_glaucoma?: string;
}

export enum ImageQuality {
  GOOD       = 'good',
  ACCEPTABLE = 'acceptable',
  POOR       = 'poor',
}

export enum DRSeverity {
  NO_DR            = 0,
  MILD_NPDR        = 1,
  MODERATE_NPDR    = 2,
  SEVERE_NPDR      = 3,
  PROLIFERATIVE_DR = 4,
}

export enum GlaucomaSeverity {
  NONE     = 0,
  SUSPECT  = 1,
  PROBABLE = 2,
  ADVANCED = 3,
}

export enum CataractSeverity {
  NONE     = 0,
  TRACE    = 1,
  MODERATE = 2,
  DENSE    = 3,
}

export enum RiskCategory {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
}

export enum ReferralPriority {
  ROUTINE  = 'routine',
  PRIORITY = 'priority',
  URGENT   = 'urgent',
}

export enum ScreeningStatus {
  IMAGE_UPLOADED       = 'image_uploaded',
  QUALITY_CHECK_FAILED = 'quality_check_failed',
  ANALYZED             = 'analyzed',
  CLINICIAN_REVIEWED   = 'clinician_reviewed',
  PENDING_SYNC         = 'pending_sync',
}

export interface RiskBreakdown {
  dr_points:       number;
  glaucoma_points: number;
  cataract_points: number;
  clinical_points: number;
  quality_penalty: number;
}

export interface Screening {
  id:                  number;
  patient_id:          number;
  eye_side:            string;
  screening_date:      string;
  performed_by:        number;
  image_filename:      string;
  image_path?:         string;

  // Quality
  image_quality?:      ImageQuality;
  quality_score?:      number;
  quality_issues?:     string;  // JSON string
  quality_guidance?:   string;

  // DR prediction
  predicted_severity?:    number;
  prediction_confidence?: number;
  class_probabilities?:   string;  // JSON string
  model_version?:         string;
  is_demo_mode:           boolean;

  // Glaucoma
  glaucoma_severity?:      number;
  glaucoma_confidence?:    number;
  glaucoma_label?:         string;
  glaucoma_message?:       string;
  glaucoma_probabilities?: string;  // JSON string
  glaucoma_requires_review: boolean;

  // Cataract (Phase 2)
  cataract_severity?:      number;
  cataract_confidence?:    number;
  cataract_label?:         string;
  cataract_message?:       string;
  cataract_probabilities?: string;  // JSON string
  cataract_requires_review: boolean;
  cataract_is_phase2:       boolean;

  // Risk score
  risk_score?:           number;
  risk_category?:        RiskCategory;
  risk_breakdown?:       string;  // JSON string → RiskBreakdown
  risk_recommendation?:  string;
  risk_factors_present?: string;  // JSON string → string[]

  // Explainability
  has_explanation:     boolean;
  explanation_summary?: string;

  // Referral
  referral_priority?:   ReferralPriority;
  referral_reasoning?:  string;
  requires_human_review: boolean;

  // Clinical review
  reviewed_by?:              number;
  review_date?:              string;
  clinician_agrees?:         boolean;
  clinician_severity?:       number;
  clinician_notes?:          string;
  final_referral_priority?:  ReferralPriority;

  status:      ScreeningStatus;
  is_synced:   boolean;
  created_at:  string;
  updated_at?: string;
}

export interface ScreeningCreate {
  patient_id: number;
  eye_side:   string;
  image:      File;
}

export interface ClinicianReview {
  clinician_agrees:         boolean;
  clinician_severity?:      number;
  clinician_notes?:         string;
  final_referral_priority:  ReferralPriority;
}

export interface DashboardStatistics {
  total_screenings:    number;
  today_screenings:    number;
  high_risk_cases:     number;
  medium_risk_cases:   number;
  low_risk_cases:      number;
  urgent_referrals:    number;
  poor_quality_images: number;
  pending_reviews:     number;
  reviewed_count:      number;
  agreement_rate:      number;
  severity_distribution: {
    no_dr: number; mild: number; moderate: number;
    severe: number; proliferative: number;
  };
  glaucoma_distribution: {
    none: number; suspect: number; probable: number; advanced: number;
  };
  cataract_distribution: {
    none: number; trace: number; moderate: number; dense: number;
  };
  weekly_trend: { date: string; count: number }[];
}

export interface AdminSummary {
  total_users:          number;
  active_users:         number;
  total_patients:       number;
  total_screenings:     number;
  high_risk_screenings: number;
  role_breakdown:       Record<string, number>;
  facility_breakdown:   { facility: string; count: number }[];
  recent_audit:         {
    action: string; user_role: string;
    screening_id?: number; timestamp?: string;
  }[];
}

// ── Label maps ────────────────────────────────────────────────────────────────

export const SEVERITY_LABELS: Record<number, string> = {
  0: 'No DR', 1: 'Mild NPDR', 2: 'Moderate NPDR',
  3: 'Severe NPDR', 4: 'Proliferative DR',
};

export const GLAUCOMA_LABELS: Record<number, string> = {
  0: 'No Indicators', 1: 'Possible (Suspect)',
  2: 'Probable', 3: 'Likely Advanced',
};

export const CATARACT_LABELS: Record<number, string> = {
  0: 'No Indicators', 1: 'Possible Trace',
  2: 'Moderate Opacity', 3: 'Dense Opacity',
};

export const PRIORITY_COLORS: Record<string, string> = {
  routine:  'text-green-600 bg-green-50',
  priority: 'text-yellow-600 bg-yellow-50',
  urgent:   'text-red-600 bg-red-50',
};

export const QUALITY_COLORS: Record<string, string> = {
  good:       'text-green-600 bg-green-50',
  acceptable: 'text-yellow-600 bg-yellow-50',
  poor:       'text-red-600 bg-red-50',
};

export const RISK_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  low:    { text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  medium: { text: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200'   },
  high:   { text: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200'     },
};
