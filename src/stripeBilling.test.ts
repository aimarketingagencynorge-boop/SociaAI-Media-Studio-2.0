import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { BILLING_PLAN } from '../billingPlan';
const state = vi.hoisted(() => ({ event: {} as any, sub: {} as any, cancel: vi.fn() }));
vi.mock('stripe', () => ({ default: class {
  webhooks = { constructEvent: () => state.event };
  subscriptions = { retrieve: async () => state.sub, cancel: state.cancel };
} }));
import { installBilling } from '../stripeBilling';

function memoryDb() {
  const rows = new Map<string, any>();
  const ref = (path: string): any => ({ path, get: async () => ({ exists: rows.has(path), data: () => rows.get(path) }),
    set: async (value: any, options?: any) => rows.set(path, options?.merge ? { ...rows.get(path), ...value } : value),
    collection: (name: string) => ({ doc: (id: string) => ref(`${path}/${name}/${id}`) }) });
  const db: any = { collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`) }),
    runTransaction: async (handler: any) => { const pending: any[] = []; const result = await handler({ get: (r: any) => r.get(), set: (r: any, v: any, o: any) => pending.push([r, v, o]) }); for (const [r,v,o] of pending) await r.set(v,o); return result; } };
  return { db, rows };
}
describe('Billing event processing', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake'); vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_fake');
    vi.stubEnv('STRIPE_PRICE_ID', 'price_49pln'); vi.stubEnv('APP_URL', 'https://example.test');
    vi.stubEnv('STRIPE_FINGERPRINT_SECRET', 'test-only-secret-at-least-32-characters');
    state.cancel.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());
  const fixture = () => {
    const {db, rows} = memoryDb();
    const hash = crypto.createHmac('sha256', process.env.STRIPE_FINGERPRINT_SECRET!).update('card-one').digest('hex');
    rows.set('billingPrivate/alice', { customerId: 'cus_alice', cardHash: hash });
    rows.set('workspaces/alice', { creditBalance: 0, starterCreditsGranted: false });
    rows.set(`cardTrials/${hash}`, { ownerUid: 'alice', used: false });
    state.sub = { id: 'sub_alice', customer: 'cus_alice', status: 'trialing', trial_end: 2000000000,
      metadata: { sociaiUid: 'alice', planVersion: BILLING_PLAN.version, cardHash: hash, trialEligible: 'true' },
      items: { data: [{price: {id: 'price_49pln'}}] },
      default_payment_method: {type: 'card', card: { fingerprint: 'card-one' } } };
    const billing = installBilling(db);
    const run = async (type: string, object: any) => {
      state.event = { id: 'evt_fake', type, data: {object} };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      await billing.webhook({ headers: {'stripe-signature': 'verified-in-separate-test'}, body: Buffer.from('{}') } as any, res);
      return res;
    };
    return { rows, run, hash };
  };
  it('grants a card trial once even if the completed checkout event is replayed', async () => {
    const {rows, run, hash} = fixture();
    await run('checkout.session.completed', {mode: 'subscription', subscription:'sub_alice'});
    expect(rows.get('workspaces/alice').creditBalance).toBe(500);
    rows.get('workspaces/alice').creditBalance = 420;
    await run('checkout.session.completed', {mode: 'subscription', subscription:'sub_alice'});
    expect(rows.get('workspaces/alice').creditBalance).toBe(420);
    expect(rows.get(`cardTrials/${hash}`).used).toBe(true);
  });
  it('cancels a trial before renewal if checkout uses a different card', async () => {
    const {rows, run} = fixture(); state.sub.default_payment_method.card.fingerprint = 'different-card';
    await run('checkout.session.completed', {mode:'subscription', subscription:'sub_alice'});
    expect(state.cancel).toHaveBeenCalledWith('sub_alice');
    expect(rows.get('workspaces/alice').creditBalance).toBe(0);
    expect(rows.get('workspaces/alice').subscriptionStatus).toBe('card_mismatch');
  });
  it('replayed and older paid invoices cannot refill the current credit balance', async () => {
    const {rows, run} = fixture(); state.sub.status = 'active';
    const invoice = {id:'in_new', status:'paid', currency:'pln', amount_paid:4900, billing_reason:'subscription_cycle',
      customer:'cus_alice', parent:{subscription_details:{subscription:'sub_alice'}}, lines:{data:[{period:{start:1900000000,end:1902600000}}]} };
    await run('invoice.paid', invoice);
    expect(rows.get('workspaces/alice').creditBalance).toBe(500);
    rows.get('workspaces/alice').creditBalance = 410;
    await run('invoice.paid', invoice);
    await run('invoice.paid', {...invoice,id:'in_old',lines:{data:[{period:{start:1800000000,end:1802600000}}]}});
    expect(rows.get('workspaces/alice').creditBalance).toBe(410);
  });
  it('does not grant credits for an unpaid invoice or wrong customer', async () => {
    const {rows, run} = fixture(); state.sub.status = 'active';
    await run('invoice.paid',{id:'in_bad',paid:false,currency:'pln',amount_paid:4900,billing_reason:'subscription_cycle'});
    expect(rows.get('workspaces/alice').creditBalance).toBe(0);
    const response = await run('invoice.paid',{id:'in_other',paid:true,currency:'pln',amount_paid:4900,billing_reason:'subscription_cycle',customer:'cus_bob',subscription:'sub_alice'});
    expect(response.status).toHaveBeenCalledWith(500);
    expect(rows.get('workspaces/alice').creditBalance).toBe(0);
  });
  it('shows renewal disabled for cancellation scheduled with cancel_at', async () => {
    const {rows, run} = fixture();
    state.sub.status = 'active';
    state.sub.cancel_at_period_end = false;
    state.sub.cancel_at = 2000000000;
    await run('customer.subscription.updated', {id: 'sub_alice'});
    expect(rows.get('workspaces/alice').cancelAtPeriodEnd).toBe(true);
  });
  it('does not reuse test customer or subscription state in live mode', async () => {
    const { db, rows } = memoryDb();
    rows.set('billingPrivate/alice', { customerId: 'cus_test', cardHash: 'test_card' });
    rows.set('workspaces/alice', { subscriptionStatus: 'active', billingMode: 'test', billingAccessUntil: '2030-01-01' });
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_fake');
    const res: any = { json: vi.fn(), status: vi.fn().mockReturnThis() };
    await installBilling(db).status({ body: { userId: 'alice' } } as any, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mode: 'live', hasCard: false, subscriptionStatus: null, accessUntil: null }));
  });
});
