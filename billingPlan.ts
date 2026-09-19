export const BILLING_PLAN = {
  version: 'sociai-pln49-500-month-7days-v1',
  amount: 4900, currency: 'pln', interval: 'month', credits: 500, trialDays: 7,
} as const;

export function trialEligibility(accountUsedTrial: boolean, cardOwner: string | undefined, uid: string, cardUsedTrial: boolean) {
  return !accountUsedTrial && !cardUsedTrial && (!cardOwner || cardOwner === uid);
}

export function validPlanPrice(price: any) {
  return price?.active === true && price.unit_amount === BILLING_PLAN.amount && price.currency === BILLING_PLAN.currency
    && price.recurring?.interval === BILLING_PLAN.interval && price.recurring.interval_count === 1
    && price.recurring.usage_type === 'licensed' && price.billing_scheme === 'per_unit' && price.tax_behavior === 'inclusive';
}

export function paidCreditInvoice(invoice: any) {
  const paid = invoice?.status === 'paid' || (invoice?.status == null && invoice?.paid === true);
  return paid && invoice.currency === BILLING_PLAN.currency
    && invoice.amount_paid >= BILLING_PLAN.amount
    && ['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason);
}
