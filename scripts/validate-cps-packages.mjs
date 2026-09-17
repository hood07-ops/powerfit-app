import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
import {
  TOMO_TEST_STATUS,
  FINAL_EXAM_STATUS,
  canPromoteStage,
  nextStageOrder,
  isTomoComplete,
} from '../packages/cps-graduation/src/index.js';
import {
  calculateSessionLoad,
  completionPercent,
  TRAINING_SESSION_STATUS,
} from '../packages/training-engine/src/index.js';
import {
  PAYMENT_PROVIDERS,
  PAYMENT_STATUS,
  parsePaymentExternalReference,
  paymentUnlockKey,
} from '../packages/payments/src/index.js';

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
const externalReference = makePaymentExternalReference({ origin: APP_ORIGINS.CPS, productType: 'tomo', productId: 1, userId: 'test-user' });
assert.equal(externalReference, 'cps:tomo:1:test-user');

assert.equal(VIDEO_REVIEW_MAX_SCORE, 100);
assert.equal(LIVE_ASSESSMENT_MAX_SCORE, 100);
assert.ok(CARD_PROGRESS_STATUSES.includes('VIDEO_UNDER_REVIEW'));
assert.ok(REVIEW_DECISIONS.includes('APPROVED'));
assert.equal(calculateVideoReviewScore({ guard_score: 20, base_score: 15, mechanics_score: 15, kinetic_chain_score: 15, coordination_score: 10, recovery_score: 10, control_score: 10, complete_execution_score: 5 }), 100);
assert.equal(calculateLiveAssessmentScore({ reproduce_score: 15, guard_score: 15, base_score: 15, correction_score: 10, speed_score: 10, movement_score: 10, combination_score: 10, partner_score: 10, safety_score: 5 }), 100);
assert.equal(canProceedToLive({ videoRequired: true, videoStatus: 'VIDEO_APPROVED' }), true);
assert.equal(isCardComplete({ videoStatus: 'VIDEO_APPROVED', liveStatus: 'LIVE_APPROVED' }), true);

assert.equal(CPS_VIDEO_BUCKET, 'cps-technique-videos');
assert.equal(buildTechniqueVideoPath({ alumnoId: 7, routeCode: 'boxing', cardId: 3, attemptNo: 2 }), '7/BOXING/3/attempt-2.mp4');
assert.equal(nextAttemptNumber([{ attempt_no: 1 }, { attempt_no: 3 }]), 4);
assert.deepEqual(validateTechniqueVideoFile({ type: 'video/mp4', size: 1024 }), { ok: true, reason: null });

assert.ok(TOMO_TEST_STATUS.includes('PASSED'));
assert.ok(FINAL_EXAM_STATUS.includes('PROMOTION_READY'));
assert.equal(canPromoteStage({ finalExamStatus: 'PASSED', criticalFail: false, coachApproved: true }), true);
assert.equal(nextStageOrder(6), 7);
assert.equal(nextStageOrder(7), null);
assert.equal(isTomoComplete('TOMO_COMPLETED'), true);

assert.ok(TRAINING_SESSION_STATUS.includes('COMPLETED'));
assert.equal(calculateSessionLoad({ durationMinutes: 60, srpe: 7 }), 420);
assert.equal(completionPercent({ completed: 3, total: 4 }), 75);

assert.equal(PAYMENT_PROVIDERS.MERCADOPAGO, 'mercadopago');
assert.ok(PAYMENT_STATUS.includes('approved'));
assert.deepEqual(parsePaymentExternalReference(externalReference), { origin: 'cps', productType: 'tomo', productId: '1', userId: 'test-user' });
assert.equal(paymentUnlockKey({ origin: 'powerfit360', productType: 'membership', productId: 'gym-basic', userId: 'u1' }), 'powerfit360:membership:gym-basic:u1');

const cpsPage = await readFile(new URL('../public/cps.html', import.meta.url), 'utf8');
assert.match(cpsPage, /Abrir tomo \/ Subir videos/);
assert.match(cpsPage, /new Blob\(\[text\]/);
assert.match(cpsPage, /const canDownload=s=>isUnlocked\(s\)/);
assert.doesNotMatch(cpsPage, /form\.action='\/api\/download-tomo'/);
assert.match(cpsPage, /cps-technique-submissions/);
assert.match(cpsPage, /submit_powerfit_card_video_secure/);

const downloadEndpoint = await readFile(new URL('../api/download-tomo.js', import.meta.url), 'utf8');
assert.match(downloadEndpoint, /new URLSearchParams\(raw\)/);
assert.match(downloadEndpoint, /Content-Disposition/);
assert.match(downloadEndpoint, /MAX_CONTENT_BYTES/);

const secureEvaluationMigration = await readFile(new URL('../supabase/migrations/20260917033202_secure_cps_evaluation_writes.sql', import.meta.url), 'utf8');
assert.match(secureEvaluationMigration, /security definer/i);
assert.match(secureEvaluationMigration, /set search_path = ''/i);
assert.match(secureEvaluationMigration, /revoke all on function public\.review_powerfit_card_video_secure/);
assert.match(secureEvaluationMigration, /revoke all on function public\.save_powerfit_live_assessment_secure/);

console.log('CPS monorepo shared package validation: PASS');
