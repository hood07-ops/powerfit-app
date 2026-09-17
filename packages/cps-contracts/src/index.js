export const APP_ORIGINS = Object.freeze({
  CPS: 'cps',
  POWERFIT360: 'powerfit360',
});

export const CPS_DISCIPLINES = Object.freeze([
  'boxing',
  'kickboxing',
  'k1',
  'multi',
]);

export const CPS_ROLES = Object.freeze({
  ATHLETE: 'athlete',
  COACH: 'coach',
  ADMIN: 'admin',
});

export const CPS_STORAGE_BUCKETS = Object.freeze({
  TECHNIQUE_VIDEOS: 'cps-technique-videos',
  ASSESSMENT_VIDEOS: 'cps-assessment-videos',
  AVATARS: 'cps-avatars',
});

export const CPS_TABLES = Object.freeze({
  PROFILES: 'profiles',
  ATHLETE_PROFILES: 'athlete_profiles',
  ALERTS: 'alerts',
  ENROLLMENTS: 'enrollments',
  PROGRAMS: 'programs',
  ENROLLMENT_DAYS: 'enrollment_days',
  PROGRAM_DAYS: 'program_days',
  PROGRAM_WEEKS: 'program_weeks',
  SESSIONS: 'sessions',
  SESSION_BLOCKS: 'session_blocks',
  SESSION_LOGS: 'session_logs',
  TECHNIQUES: 'techniques',
  TECHNIQUE_STEPS: 'technique_steps',
  TECHNIQUE_VIDEOS: 'technique_videos',
  TECHNIQUE_DRILLS: 'technique_drills',
  DRILLS: 'drills',
  ASSESSMENTS: 'assessments',
  TECHNICAL_ASSESSMENT_ITEMS: 'technical_assessment_items',
  WEEKLY_REVIEWS: 'weekly_reviews',
  RECOVERY_LOGS: 'recovery_logs',
  BODY_METRICS: 'body_metrics',
  PAIN_REPORTS: 'pain_reports',
});

export const CPS_RPCS = Object.freeze({
  START_MVP_ENROLLMENT: 'start_cps_mvp_enrollment',
  HAS_COMPLETED_INITIAL_ASSESSMENT: 'has_completed_initial_assessment',
  COMPLETE_INITIAL_ASSESSMENT: 'complete_initial_assessment',
  COMPLETE_FINAL_ASSESSMENT: 'complete_final_assessment',
  COMPLETE_WEEKLY_REVIEW: 'complete_weekly_review',
  GET_ASSESSMENT_COMPARISON: 'get_assessment_comparison',
  ACKNOWLEDGE_MY_ALERT: 'acknowledge_my_alert',
  SET_MY_AVATAR_PATH: 'set_my_avatar_path',
  GET_MY_PROGRESS_DASHBOARD: 'get_my_progress_dashboard',
  GET_COACH_ATHLETE_PROGRESS: 'get_coach_athlete_progress',
  GET_COACH_PROFILE: 'get_coach_profile',
  GET_COACH_ATHLETES: 'get_coach_athletes',
  GET_COACH_ATHLETE_DETAIL: 'get_coach_athlete_detail',
  CREATE_COACH_FEEDBACK: 'create_coach_feedback',
  OVERRIDE_ENROLLMENT_DAY_SESSION: 'override_enrollment_day_session',
  CREATE_TECHNICAL_ASSESSMENT: 'create_technical_assessment',
  GET_ATHLETE_FEEDBACK: 'get_athlete_feedback',
  MARK_COACH_FEEDBACK_READ: 'mark_coach_feedback_read',
  SAVE_DAILY_RECOVERY: 'save_daily_recovery',
  SAVE_BODY_METRIC: 'save_body_metric',
  SAVE_PAIN_REPORT: 'save_pain_report',
  START_ENROLLMENT_SESSION: 'start_enrollment_session',
  COMPLETE_SESSION: 'complete_session',
});

export const CPS_MVP = Object.freeze({
  PROGRAM_CODE: 'CPS-PROG-MVP-08',
  PROGRAM_NAME: 'CPS Fighter - Fundamentals & Performance',
  WEEKS: 8,
  FINAL_TEST_SESSION_CODE: 'CPS-SES-TEST-016',
});

export function makePaymentExternalReference({ origin, productType, productId, userId }) {
  if (!Object.values(APP_ORIGINS).includes(origin)) {
    throw new Error(`Unsupported app origin: ${origin}`);
  }

  const parts = [origin, productType, productId, userId]
    .map((value) => String(value ?? '').trim())
    .map((value) => value.replace(/[^a-zA-Z0-9_-]/g, '-'));

  if (parts.some((part) => !part)) {
    throw new Error('origin, productType, productId and userId are required');
  }

  return parts.join(':');
}
