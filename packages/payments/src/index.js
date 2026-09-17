export const PAYMENT_PROVIDERS = Object.freeze({ MERCADOPAGO: 'mercadopago' });
export const PAYMENT_STATUS = Object.freeze(['pending','approved','rejected','cancelled','refunded']);
export const PRODUCT_TYPES = Object.freeze({ CPS_TOMO: 'tomo', SUBSCRIPTION: 'subscription', MEMBERSHIP: 'membership' });

export function parsePaymentExternalReference(value) {
  const [origin, productType, productId, userId] = String(value || '').split(':');
  if (![origin, productType, productId, userId].every(Boolean)) throw new Error('Invalid external reference');
  return { origin, productType, productId, userId };
}

export function paymentUnlockKey({ origin, productType, productId, userId }) {
  return [origin, productType, productId, userId].map((v) => String(v ?? '').trim()).join(':');
}
