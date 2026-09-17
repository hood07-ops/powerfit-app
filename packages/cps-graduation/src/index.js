export const TOMO_TEST_STATUS = Object.freeze(['NOT_ELIGIBLE','ELIGIBLE','SCHEDULED','IN_PROGRESS','FAILED','PASSED']);
export const FINAL_EXAM_STATUS = Object.freeze(['SCHEDULED','IN_PROGRESS','FAILED','PASSED','COACH_APPROVAL_PENDING','PROMOTION_READY']);
export const ENROLLMENT_STATUS = Object.freeze(['ACTIVE','PAUSED','COMPLETED','WITHDRAWN']);

export function canPromoteStage({ finalExamStatus, criticalFail, coachApproved }) {
  return finalExamStatus === 'PASSED' && criticalFail === false && coachApproved === true;
}

export function nextStageOrder(currentStageOrder, maxStageOrder = 7) {
  const current = Number(currentStageOrder);
  if (!Number.isInteger(current) || current < 1) throw new Error('Invalid currentStageOrder');
  return current >= maxStageOrder ? null : current + 1;
}

export function isTomoComplete(status) {
  return status === 'TOMO_COMPLETED';
}
