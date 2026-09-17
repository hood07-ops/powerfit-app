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

console.log('CPS package validation: PASS');
