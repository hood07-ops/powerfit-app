import assert from 'node:assert/strict';
import {
  APP_ORIGINS,
  CPS_DISCIPLINES,
  CPS_ROLES,
  makePaymentExternalReference,
} from '../packages/cps-contracts/src/index.js';
import {
  CPS_ROUTE_CODES,
  CPS_STAGES,
  CPS_TOMOS,
  CPS_TOMO_PRICE_CLP,
  getCpsStage,
  getCpsTomo,
} from '../packages/cps-content/src/catalog.js';
import {
  CARD_PROGRESS_STATUSES,
  LIVE_ASSESSMENT_MAX_SCORE,
  REVIEW_DECISIONS,
  VIDEO_REVIEW_MAX_SCORE,
  calculateLiveAssessmentScore,
  calculateVideoReviewScore,
  canProceedToLive,
  isCardComplete,
} from '../packages/cps-evaluations/src/index.js';
import {
  CPS_VIDEO_BUCKET,
  buildTechniqueVideoPath,
  nextAttemptNumber,
  validateTechniqueVideoFile,
} from '../packages/cps-video/src/index.js';

assert.equal(CPS_TOMOS.length, 12, 'Current production schema supports exactly 12 CPS tomos');
assert.deepEqual(CPS_TOMOS.map((item) => item.tomoNo), Array.from({ length: 12 }, (_, index) => index + 1));
assert.ok(CPS_TOMOS.every((item) => item.priceClp === CPS_TOMO_PRICE_CLP));
assert.equal(CPS_TOMO_PRICE_CLP, 5000);

assert.equal(CPS_STAGES.BOXING.length, 7);
assert.equal(CPS_STAGES.KICKBOXING.length, 7);
assert.equal(getCpsStage(CPS_ROUTE_CODES.BOXING, 1)?.label, 'Boxeo Nivel 1');
assert.equal(getCpsStage(CPS_ROUTE_CODES.KICKBOXING, 7)?.label, 'Negro');
assert.equal(getCpsTomo(12)?.title, 'Análisis Técnico y Video');
assert.equal(getCpsTomo(13), null);

assert.ok(CPS_DISCIPLINES.includes('boxing'));
assert.equal(CPS_ROLES.ADMIN, 'admin');
assert.equal(
  makePaymentExternalReference({
    origin: APP_ORIGINS.CPS,
    productType: 'tomo',
    productId: 1,
    userId: 'test-user',
  }),
  'cps:tomo:1:test-user',
);

assert.equal(VIDEO_REVIEW_MAX_SCORE, 100);
assert.equal(LIVE_ASSESSMENT_MAX_SCORE, 100);
assert.ok(CARD_PROGRESS_STATUSES.includes('VIDEO_UNDER_REVIEW'));
assert.ok(REVIEW_DECISIONS.includes('APPROVED'));
assert.equal(calculateVideoReviewScore({
  guard_score: 20,
  base_score: 15,
  mechanics_score: 15,
  kinetic_chain_score: 15,
  coordination_score: 10,
  recovery_score: 10,
  control_score: 10,
  complete_execution_score: 5,
}), 100);
assert.equal(calculateLiveAssessmentScore({
  reproduce_score: 15,
  guard_score: 15,
  base_score: 15,
  correction_score: 10,
  speed_score: 10,
  movement_score: 10,
  combination_score: 10,
  partner_score: 10,
  safety_score: 5,
}), 100);
assert.equal(canProceedToLive({ videoRequired: true, videoStatus: 'VIDEO_APPROVED' }), true);
assert.equal(isCardComplete({ videoStatus: 'VIDEO_APPROVED', liveStatus: 'LIVE_APPROVED' }), true);

assert.equal(CPS_VIDEO_BUCKET, 'cps-technique-videos');
assert.equal(
  buildTechniqueVideoPath({ alumnoId: 7, routeCode: 'boxing', cardId: 3, attemptNo: 2 }),
  '7/BOXING/3/attempt-2.mp4',
);
assert.equal(nextAttemptNumber([{ attempt_no: 1 }, { attempt_no: 3 }]), 4);
assert.deepEqual(
  validateTechniqueVideoFile({ type: 'video/mp4', size: 1024 }),
  { ok: true, reason: null },
);

console.log('CPS package validation: PASS');
