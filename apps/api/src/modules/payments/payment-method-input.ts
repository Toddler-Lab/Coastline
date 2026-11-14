import { PAYMENT_METHODS, type PaymentMethodInput } from '@coastline/api-contracts';

/** Values the create requests accept for `paymentMethod`. */
// legacy: remove in WP-23 — 'MOCK' keeps the current web app working.
export const PAYMENT_METHOD_INPUTS: readonly PaymentMethodInput[] = [...PAYMENT_METHODS, 'MOCK'];

export const PAYMENT_METHOD_INPUT_MESSAGE = `paymentMethod must be one of ${PAYMENT_METHODS.join(', ')}`;
