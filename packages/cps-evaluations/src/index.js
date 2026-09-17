export const VIDEO_SUBMISSION_STATUSES = Object.freeze([
  'VIDEO_SUBMITTED',
  'VIDEO_UNDER_REVIEW',
  'VIDEO_CORRECTION_REQUIRED',
  'VIDEO_APPROVED',
  'ARCHIVED',
]);

export const CARD_PROGRESS_STATUSES = Object.freeze([
  'LOCKED',
  'AVAILABLE',
  'LEARNING',
  'VIDEO_REQUIRED',
  'VIDEO_SUBMITTED',
  'VIDEO_UNDER_REVIEW',
  'VIDEO_CORRECTION_REQUIRED',
  'VIDEO_APPROVED',
  'LIVE_PENDING',
  'LIVE_CORRECTION_REQUIRED',
  'LIVE_APPROVED',
  'COMPLETED',
]);

export const REVIEW_DECISIONS = Object.freeze([
  'CORRECTION_REQUIRED',
  'APPROVED',
]);

export const VIDEO_REVIEW_RUBRIC = Object.freeze([
  { key: 'guard_score', label: 'Guardia', max: 20 },
  { key: 'base_score', label: 'Base', max: 15 },
  { key: 'mechanics_score', label: 'Mecánica', max: 15 },
  { key: 'kinetic_chain_score', label: 'Cadena cinética', max: 15 },
  { key: 'coordination_score', label: 'Coordinación', max: 10 },
  { key: 'recovery_score', label: 'Recuperación', max: 10 },
  { key: 'control_score', label: 'Control', max: 10 },
  { key: 'complete_execution_score', label: 'Ejecución completa', max: 5 },
]);

export const LIVE_ASSESSMENT_RUBRIC = Object.freeze([
  { key: 'reproduce_score', label: 'Reproducción técnica', max: 15 },
  { key: 'guard_score', label: 'Guardia', max: 15 },
  { key: 'base_score', label: 'Base', max: 15 },
  { key: 'correction_score', label: 'Capacidad de corrección', max: 10 },
  { key: 'speed_score', label: 'Velocidad', max: 10 },
  { key: 'movement_score', label: 'Desplazamiento', max: 10 },
  { key: 'combination_score', label: 'Combinación', max: 10 },
  { key: 'partner_score', label: 'Trabajo con compañero', max: 10 },
  { key: 'safety_score', label: 'Seguridad', max: 5 },
]);

export const VIDEO_REVIEW_MAX_SCORE = VIDEO_REVIEW_RUBRIC.reduce((sum, item) => sum + item.max, 0);
export const LIVE_ASSESSMENT_MAX_SCORE = LIVE_ASSESSMENT_RUBRIC.reduce((sum, item) => sum + item.max, 0);

export function calculateRubricScore(rubric, scores) {
  return rubric.reduce((sum, item) => {
    const value = Number(scores?.[item.key] ?? 0);
    if (!Number.isFinite(value) || value < 0 || value > item.max) {
      throw new Error(`Invalid score for ${item.key}; expected 0-${item.max}`);
    }
    return sum + value;
  }, 0);
}

export function calculateVideoReviewScore(scores) {
  return calculateRubricScore(VIDEO_REVIEW_RUBRIC, scores);
}

export function calculateLiveAssessmentScore(scores) {
  return calculateRubricScore(LIVE_ASSESSMENT_RUBRIC, scores);
}

export function canProceedToLive({ videoRequired = true, videoStatus }) {
  return !videoRequired || videoStatus === 'VIDEO_APPROVED';
}

export function isCardComplete({ videoRequired = true, liveRequired = true, videoStatus, liveStatus }) {
  const videoOk = !videoRequired || videoStatus === 'VIDEO_APPROVED';
  const liveOk = !liveRequired || liveStatus === 'LIVE_APPROVED';
  return videoOk && liveOk;
}
