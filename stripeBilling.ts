import Stripe from 'stripe';
import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { BILLING_PLAN, paidCreditInvoice, trialEligibility, validPlanPrice } from './billingPlan';

export function installBilling(db: Firestore) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const fingerprintSecret = process.env.STRIPE_FINGERPRINT_SECRET;
  const priceId = process.env.STRIPE_PRICE_ID;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const publicUrl = process.env.APP_URL;
  const enabled = !!(secret && fingerprintSecret && fingerprintSecret.length >= 32 && priceId && webhookSecret && publicUrl);
  const stripe = secret ? new Stripe(secret) : null;
  const live = /^(sk|rk)_live_/.test(secret || '');
  const mode = live ? 'live' : 'test';
  const collectionName = (name: string) => live ? `${name}Live` : name;
  const privateDoc = (uid: string) => db.collection(collectionName('billingPrivate')).doc(uid);
  const walletDoc = (uid: string) => db.collection('workspaces').doc(uid);
  const requireStripe = () => {
    if (!enabled || !stripe) throw new Error('BILLING_NOT_CONFIGURED');
    const origin = new URL(publicUrl!);
    if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('HTTPS_REQUIRED');
    return stripe;
  };
  const cardHash = (method: any) => {
    if (method?.type !== 'card' || !method.card?.fingerprint || method.card.wallet) throw new Error('DIRECT_CARD_REQUIRED');
    return crypto.createHmac('sha256', fingerprintSecret!).update(method.card.fingerprint).digest('hex');
  };
  const errorResponse = (res: Response, error: any) => {
    const code = error instanceof Error ? error.message : '';
    const messages: Record<string, string> = {
      BILLING_NOT_CONFIGURED: 'Rejestracja kart nie jest jeszcze uruchomiona. Możesz korzystać z warsztatu bez AI.',
      PRICE_MISMATCH: 'Oferta płatnicza wymaga konfiguracji operatora. Nie pobrano opłaty.',
      CARD_REQUIRED: 'Najpierw zarejestruj kartę i poczekaj na jej potwierdzenie.',
      DIRECT_CARD_REQUIRED: 'Dla pakietu startowego wpisz dane karty bezpośrednio w Stripe, bez portfela cyfrowego.',
      CONSENT_REQUIRED: 'Przeczytaj i zaakceptuj aktualne warunki abonamentu.',
      ALREADY_SUBSCRIBED: 'Masz już rozpoczęty abonament. Sprawdź jego status lub zarządzaj nim w panelu płatności.',
      STARTER_DAILY_LIMIT: 'Dzisiejsza pula prób jest wyczerpana. Spróbuj jutro; nie uruchomiono płatnego planu.',
    };
    res.status(code === 'CONSENT_REQUIRED' ? 400 : code === 'ALREADY_SUBSCRIBED' ? 409 : 503)
      .json({ error: messages[code] || 'Nie udało się ukończyć operacji płatniczej. Spróbuj ponownie.' });
  };

  const customerFor = async (uid: string, email: string) => {
    const api = requireStripe();
    const saved = (await privateDoc(uid).get()).data();
    if (saved?.customerId) return saved.customerId as string;
    const customer = await api.customers.create({ email, metadata: { sociaiUid: uid } }, { idempotencyKey: `sociai-customer-${uid}` });
    await privateDoc(uid).set({ customerId: customer.id }, { merge: true });
    return customer.id;
  };

  const status = async (req: Request, res: Response) => {
    try {
      const uid = req.body.userId;
      const [privateSnap, walletSnap] = await Promise.all([privateDoc(uid).get(), walletDoc(uid).get()]);
      const saved = privateSnap.data() || {}; const wallet = walletSnap.data() || {};
      const claim = saved.cardHash ? (await db.collection(collectionName('cardTrials')).doc(saved.cardHash).get()).data() : undefined;
      const matchingMode = (wallet.billingMode || 'test') === mode;
      res.json({ configured: enabled, mode, plan: BILLING_PLAN, hasCard: !!saved.cardHash,
        eligible: !!saved.cardHash && trialEligibility(!!wallet.starterCreditsGranted, claim?.ownerUid, uid, !!claim?.used),
        subscriptionStatus: matchingMode ? wallet.subscriptionStatus || null : null, accessUntil: matchingMode ? wallet.billingAccessUntil || null : null,
        cancelAtPeriodEnd: matchingMode && !!wallet.cancelAtPeriodEnd, trialStatus: matchingMode ? wallet.trialStatus || null : null });
    } catch (error) { errorResponse(res, error); }
  };

  const setup = async (req: Request, res: Response) => {
    try {
      const api = requireStripe(); const uid = req.body.userId;
      const customer = await customerFor(uid, req.body.email);
      const session = await api.checkout.sessions.create({ mode: 'setup', locale: 'pl', customer,
        currency: 'pln', payment_method_types: ['card'], client_reference_id: uid,
        metadata: { sociaiUid: uid }, setup_intent_data: { metadata: { sociaiUid: uid } },
        custom_text: { submit: { message: 'To rejestracja karty. Abonament i termin obciążenia zaakceptujesz w kolejnym kroku. Sama rejestracja karty nie uruchamia opłaty.' } },
        success_url: `${publicUrl}/?billing=card`, cancel_url: `${publicUrl}/?billing=cancel`,
      });
      res.json({ url: session.url });
    } catch (error) { errorResponse(res, error); }
  };

  const subscribe = async (req: Request, res: Response) => {
    try {
      const api = requireStripe(); const uid = req.body.userId;
      if (req.body.accepted !== true || req.body.planVersion !== BILLING_PLAN.version) throw new Error('CONSENT_REQUIRED');
      const price = await api.prices.retrieve(priceId!);
      if (!validPlanPrice(price)) throw new Error('PRICE_MISMATCH');
      const saved = (await privateDoc(uid).get()).data();
      if (!saved?.customerId || !saved.cardHash) throw new Error('CARD_REQUIRED');
      const existing = await api.subscriptions.list({ customer: saved.customerId, status: 'all', limit: 100 });
      if (existing.data.some(sub => !['canceled', 'incomplete_expired'].includes(sub.status))) throw new Error('ALREADY_SUBSCRIBED');
      // Reuse an open checkout, including requests racing on different replicas.
      if (saved.checkoutId) {
        const previous = await api.checkout.sessions.retrieve(saved.checkoutId);
        if (previous.status === 'open') { res.json({ url: previous.url }); return; }
      }
      const now = new Date().toISOString();
      const claimRef = db.collection(collectionName('cardTrials')).doc(saved.cardHash);
      const counterRef = db.collection('systemCounters').doc(`starter-${now.slice(0, 10)}`);
      const operation = await db.runTransaction(async tx => {
        const [wallet, card, counter, current] = await Promise.all([tx.get(walletDoc(uid)), tx.get(claimRef), tx.get(counterRef), tx.get(privateDoc(uid))]);
        if (current.data()?.cardHash !== saved.cardHash) throw new Error('CARD_REQUIRED');
        const claim = card.data();
        const eligible = trialEligibility(!!wallet.data()?.starterCreditsGranted, claim?.ownerUid, uid, !!claim?.used);
        const limit = Number(process.env.STARTER_DAILY_LIMIT ?? 25);
        if (eligible && !card.exists) {
          const count = Number(counter.data()?.count || 0);
          if (count >= (Number.isInteger(limit) && limit >= 0 ? limit : 25)) throw new Error('STARTER_DAILY_LIMIT');
          tx.set(counterRef, { count: count + 1, updatedAt: now });
          tx.set(claimRef, { ownerUid: uid, used: false, reservedAt: now });
        }
        const previous = current.data();
        // Every expired session gets a new operation; simultaneous calls share one.
        const operationId = previous?.operationId && !previous?.checkoutId
          ? previous.operationId : crypto.randomUUID();
        tx.set(privateDoc(uid), { operationId, checkoutId: null, acceptedPlan: BILLING_PLAN.version, acceptedLegalVersion: '2026-09-19', acceptedAt: now }, { merge: true });
        return { eligible, operationId };
      });
      const session = await api.checkout.sessions.create({ mode: 'subscription', locale: 'pl', customer: saved.customerId,
        client_reference_id: uid, payment_method_types: ['card'], payment_method_collection: 'always',
        line_items: [{ price: priceId!, quantity: 1 }],
        subscription_data: {
          metadata: { sociaiUid: uid, planVersion: BILLING_PLAN.version, cardHash: saved.cardHash, trialEligible: String(operation.eligible), credits: String(BILLING_PLAN.credits) },
          ...(operation.eligible ? { trial_period_days: BILLING_PLAN.trialDays } : {}),
        },
        metadata: { sociaiUid: uid },
        custom_text: { submit: { message: operation.eligible
          ? '7 dni i maks. 500 FC gratis, potem 49 zł miesięcznie za 500 FC. Abonament odnawia się automatycznie. Anuluj przed końcem próby, aby uniknąć pierwszej opłaty. Użyj tej samej zarejestrowanej karty.'
          : 'Darmowy start został wykorzystany dla tego konta lub karty. Pierwsza opłata 49 zł przy aktywacji, następnie 49 zł miesięcznie za 500 FC. Abonament odnawia się automatycznie.' } },
        success_url: `${publicUrl}/?billing=subscription`, cancel_url: `${publicUrl}/?billing=cancel`,
      }, { idempotencyKey: `sociai-subscribe-${uid}-${operation.operationId}` });
      await privateDoc(uid).set({ checkoutId: session.id }, { merge: true });
      res.json({ url: session.url });
    } catch (error) { errorResponse(res, error); }
  };

  const portal = async (req: Request, res: Response) => {
    try {
      const api = requireStripe(); const saved = (await privateDoc(req.body.userId).get()).data();
      if (!saved?.customerId) throw new Error('CARD_REQUIRED');
      const session = await api.billingPortal.sessions.create({ customer: saved.customerId, locale: 'pl',
        ...(process.env.STRIPE_PORTAL_CONFIGURATION_ID ? { configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID } : {}),
        return_url: `${publicUrl}/?billing=return` });
      res.json({ url: session.url });
    } catch (error) { errorResponse(res, error); }
  };

  const syncSubscription = async (subId: string, grantTrial = false) => {
    const api = requireStripe(); const sub: any = await api.subscriptions.retrieve(subId, { expand: ['default_payment_method'] });
    const uid = sub.metadata?.sociaiUid;
    if (!uid || sub.metadata.planVersion !== BILLING_PLAN.version) return;
    const saved = (await privateDoc(uid).get()).data();
    if (saved?.customerId !== sub.customer) throw new Error('CUSTOMER_MISMATCH');
    const walletRef = walletDoc(uid);
    const fields: any = { billingMode: mode, subscriptionId: sub.id, subscriptionStatus: sub.status, cancelAtPeriodEnd: !!(sub.cancel_at_period_end || sub.cancel_at) };
    if (sub.status === 'canceled') fields.billingAccessUntil = new Date().toISOString();
    if (grantTrial && sub.status === 'trialing' && sub.metadata.trialEligible === 'true') {
      if (!sub.default_payment_method) {
        const customer: any = await api.customers.retrieve(sub.customer, { expand: ['invoice_settings.default_payment_method'] });
        sub.default_payment_method = customer.invoice_settings?.default_payment_method;
      }
      if (!sub.default_payment_method) throw new Error('CARD_PENDING');
      let hash = '';
      try { hash = cardHash(sub.default_payment_method); } catch { /* Cancel ineligible trial below. */ }
      if (hash !== sub.metadata.cardHash) {
        await api.subscriptions.cancel(sub.id);
        await walletRef.set({ subscriptionId: sub.id, subscriptionStatus: 'card_mismatch', billingAccessUntil: new Date().toISOString() }, { merge: true });
        return;
      }
      const claimRef = db.collection(collectionName('cardTrials')).doc(hash);
      await db.runTransaction(async tx => {
        const [wallet, claim] = await Promise.all([tx.get(walletRef), tx.get(claimRef)]);
        if (wallet.data()?.starterCreditsGranted) { tx.set(walletRef, fields, { merge: true }); return; }
        if (claim.data()?.ownerUid !== uid || claim.data()?.used) throw new Error('TRIAL_ALREADY_USED');
        tx.set(claimRef, { used: true, usedAt: new Date().toISOString() }, { merge: true });
        tx.set(walletRef, { ...fields, starterCreditsGranted: true, creditBalance: BILLING_PLAN.credits, trialStatus: 'active', activeSource: 'starter_credits', billingAccessUntil: new Date(sub.trial_end * 1000).toISOString() }, { merge: true });
        tx.set(db.collection('users').doc(uid), { credits: BILLING_PLAN.credits }, { merge: true });
        tx.set(walletRef.collection('transactions').doc(`trial-${sub.id}`), { userId: uid, actionType: 'initial_grant', amount: BILLING_PLAN.credits, source: 'starter', createdAt: new Date().toISOString() });
      });
    } else { await walletRef.set(fields, { merge: true }); }
  };

  const invoicePaid = async (invoice: any) => {
    if (!paidCreditInvoice(invoice)) return;
    const subId = invoice.parent?.subscription_details?.subscription || invoice.subscription;
    if (typeof subId !== 'string') return;
    const sub: any = await requireStripe().subscriptions.retrieve(subId);
    const uid = sub.metadata?.sociaiUid;
    if (!uid || sub.metadata.planVersion !== BILLING_PLAN.version || sub.items.data[0]?.price.id !== priceId) return;
    const saved = (await privateDoc(uid).get()).data();
    if (saved?.customerId !== invoice.customer || sub.customer !== invoice.customer) throw new Error('CUSTOMER_MISMATCH');
    const periodEnd = Math.max(...(invoice.lines?.data || []).map((line: any) => line.period?.end || 0));
    const periodStart = Math.max(...(invoice.lines?.data || []).map((line: any) => line.period?.start || 0));
    if (!periodEnd) throw new Error('INVOICE_PERIOD_MISSING');
    const receipt = db.collection(collectionName('billingInvoices')).doc(invoice.id); const walletRef = walletDoc(uid);
    await db.runTransaction(async tx => {
      const [seen, wallet] = await Promise.all([tx.get(receipt), tx.get(walletRef)]);
      if (seen.exists) return;
      tx.set(receipt, { uid, subscriptionId: sub.id, periodStart, paidAt: new Date().toISOString() });
      // Late and replayed invoices never reset the current month's balance.
      if ((wallet.data()?.billingMode || 'test') === mode && (wallet.data()?.paidPeriodStart || 0) >= periodStart) return;
      tx.set(walletRef, { billingMode: mode, creditBalance: BILLING_PLAN.credits, activeSource: 'purchased_credits', subscriptionId: sub.id,
        subscriptionStatus: sub.status, paidPeriodStart: periodStart, trialStatus: 'completed',
        billingAccessUntil: new Date(periodEnd * 1000).toISOString(), cancelAtPeriodEnd: !!(sub.cancel_at_period_end || sub.cancel_at) }, { merge: true });
      tx.set(db.collection('users').doc(uid), { credits: BILLING_PLAN.credits }, { merge: true });
      tx.set(walletRef.collection('transactions').doc(invoice.id), { userId: uid, actionType: 'purchase', amount: BILLING_PLAN.credits - (wallet.data()?.creditBalance || 0), source: 'subscription_renewal', createdAt: new Date().toISOString() });
    });
  };

  const webhook = async (req: Request, res: Response) => {
    let event: Stripe.Event;
    try { event = requireStripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, webhookSecret!); }
    catch { res.status(400).json({ error: 'Invalid webhook signature or billing configuration' }); return; }
    try {
      const item: any = event.data.object;
      if (event.type === 'checkout.session.completed' && item.mode === 'setup') {
        const intent: any = await requireStripe().setupIntents.retrieve(item.setup_intent, { expand: ['payment_method'] });
        const uid = item.metadata?.sociaiUid;
        if (!uid) { res.json({ received: true }); return; }
        const saved = (await privateDoc(uid).get()).data();
        if (!uid || intent.status !== 'succeeded' || saved?.customerId !== item.customer || intent.customer !== item.customer) throw new Error('SETUP_MISMATCH');
        try {
          const hash = cardHash(intent.payment_method);
          if ((saved?.cardVerifiedAt || 0) > intent.created) { res.json({ received: true }); return; }
          if (saved?.checkoutId && saved.cardHash !== hash) {
            const old = await requireStripe().checkout.sessions.retrieve(saved.checkoutId);
            if (old.status === 'open') await requireStripe().checkout.sessions.expire(old.id);
          }
          await privateDoc(uid).set({ cardHash: hash, cardVerifiedAt: intent.created, verifiedAt: new Date().toISOString(), ...(saved?.cardHash !== hash ? { checkoutId: null, operationId: null } : {}) }, { merge: true });
          await walletDoc(uid).set({ trialStatus: 'card_verified' }, { merge: true });
        } catch (error: any) {
          if (error.message !== 'DIRECT_CARD_REQUIRED') throw error;
          await walletDoc(uid).set({ trialStatus: 'direct_card_required' }, { merge: true });
        }
      } else if (event.type === 'checkout.session.completed' && item.mode === 'subscription') {
        await syncSubscription(item.subscription, true);
      } else if (event.type === 'invoice.paid') { await invoicePaid(item); }
      else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) { await syncSubscription(item.id); }
      res.json({ received: true });
    } catch (error) {
      // Returning 500 asks Stripe to retry. Never acknowledge a failed credit write.
      console.error('[Billing] webhook processing failed', event.id, event.type);
      res.status(500).json({ error: 'Webhook processing incomplete' });
    }
  };
  return { status, setup, subscribe, portal, webhook };
}
