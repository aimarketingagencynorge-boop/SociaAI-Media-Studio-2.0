import { describe, it, expect } from 'vitest';
import { BILLING_PLAN, paidCreditInvoice, trialEligibility, validPlanPrice } from '../billingPlan';
import Stripe from 'stripe';

describe('Card trial and subscription policy', () => {
  it('gives a trial only to a new account with an unused card', () => {
    expect(trialEligibility(false, undefined, 'alice', false)).toBe(true);
    expect(trialEligibility(false, 'alice', 'alice', false)).toBe(true);
    expect(trialEligibility(false, 'bob', 'alice', false)).toBe(false);
    expect(trialEligibility(false, 'alice', 'alice', true)).toBe(false);
    expect(trialEligibility(true, undefined, 'alice', false)).toBe(false);
  });
  it('requires exactly the accepted recurring, tax-inclusive price', () => {
    const price = { active: true, unit_amount: 4900, currency: 'pln', recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' }, tax_behavior: 'inclusive', billing_scheme: 'per_unit' };
    expect(validPlanPrice(price)).toBe(true);
    expect(validPlanPrice({ ...price, unit_amount: 9900 })).toBe(false);
    expect(validPlanPrice({ ...price, currency: 'eur' })).toBe(false);
    expect(validPlanPrice({ ...price, tax_behavior: 'exclusive' })).toBe(false);
    expect(validPlanPrice({ ...price, recurring: { ...price.recurring, interval: 'year' } })).toBe(false);
  });
  it('does not grant monthly credits on free trial invoices, failed payments or prorations', () => {
    const invoice = { paid: true, currency: 'pln', amount_paid: BILLING_PLAN.amount, billing_reason: 'subscription_cycle' };
    expect(paidCreditInvoice(invoice)).toBe(true);
    expect(paidCreditInvoice({ ...invoice, amount_paid: 0 })).toBe(false);
    expect(paidCreditInvoice({ ...invoice, paid: false })).toBe(false);
    expect(paidCreditInvoice({ ...invoice, billing_reason: 'subscription_update' })).toBe(false);
  });
  it('verifies the raw webhook body and rejects changed or expired signatures', () => {
    const stripe = new Stripe('sk_test_placeholder');
    const secret = 'whsec_test_only';
    const payload = JSON.stringify({ id: 'evt_test', type: 'invoice.paid', data: { object: {} } });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(stripe.webhooks.constructEvent(payload, signature, secret).id).toBe('evt_test');
    expect(() => stripe.webhooks.constructEvent(payload + ' ', signature, secret)).toThrow();
    const old = stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: 1 });
    expect(() => stripe.webhooks.constructEvent(payload, old, secret)).toThrow();
  });
  it('recognizes current Stripe invoices without the removed paid boolean', () => {
    const invoice = { status: 'paid', currency: 'pln', amount_paid: 4900, billing_reason: 'subscription_create' };
    expect(paidCreditInvoice(invoice)).toBe(true);
    expect(paidCreditInvoice({ ...invoice, status: 'open', paid: true })).toBe(false);
    expect(paidCreditInvoice({ ...invoice, amount_paid: 0 })).toBe(false);
  });
});
