import React, { useEffect, useState } from 'react';
import { apiFetch } from '../apiClient';
import { BILLING_PLAN } from '../billingPlan';
import { useStore } from '../store';

interface Status { configured: boolean; hasCard: boolean; eligible: boolean; subscriptionStatus?: string; accessUntil?: string; cancelAtPeriodEnd?: boolean; trialStatus?: string }
export default function SubscriptionPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const workspaceId = useStore(s => s.workspaceId);
  const refresh = async () => {
    const response = await apiFetch('/api/billing/status', { method: 'POST', body: '{}' });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    setStatus(data);
  };
  useEffect(() => {
    let stopped = false;
    const poll = async () => { if (!stopped) try { await refresh(); } catch (err) { if (!stopped) setError((err as Error).message); } };
    void poll(); const timer = setInterval(poll, 10000);
    return () => { stopped = true; clearInterval(timer); };
  }, [workspaceId]);
  const open = async (endpoint: string) => {
    if (busy) return; setBusy(true); setError('');
    try {
      const response = await apiFetch(`/api/billing/${endpoint}`, { method: 'POST', body: JSON.stringify({ accepted, planVersion: BILLING_PLAN.version }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('Nieprawidłowy adres operatora płatności.');
      window.location.assign(url.href);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  };
  const active = !!status?.subscriptionStatus && !['canceled', 'incomplete_expired', 'card_mismatch'].includes(status.subscriptionStatus);
  return <section className="mb-8 rounded-3xl border border-cyan-300/25 bg-cyan-300/5 p-6 md:p-8 text-white">
    <p className="text-cyan-300 font-mono text-xs tracking-widest">SOCIAI / ABONAMENT</p>
    <h2 className="text-3xl font-bold mt-3">49 zł / miesiąc</h2>
    <p className="text-slate-300 mt-3">500 FC w każdym opłaconym miesiącu. Nowe konto i karta: 7 dni oraz maksymalnie 500 FC gratis. Karta jest wymagana.</p>
    <ul className="text-sm text-slate-400 mt-4 space-y-2 list-disc pl-5"><li>Jeden darmowy start na konto i kartę. Kolejne konto nie odnawia gratisu.</li><li>Karta użyta wcześniej: 49 zł przy uruchomieniu abonamentu, potem co miesiąc.</li><li>Po próbie automatycznie 49 zł miesięcznie. Anuluj przed końcem próby, aby uniknąć pierwszej opłaty.</li><li>Niewykorzystane FC nie przechodzą na kolejny okres. Wyczerpanie FC nie przyspiesza opłaty.</li><li>Numer karty podajesz wyłącznie operatorowi Stripe. Zapisane materiały pozostają dostępne po zakończeniu dostępu AI.</li></ul>
    {!status && <p role="status" className="mt-5 text-slate-400">Sprawdzam status rozliczeń…</p>}
    {status && !status.configured && <p className="mt-5 p-4 rounded-xl bg-amber-300/10 text-amber-200">Rejestracja kart i abonament czekają na podłączenie Stripe. Obecnie nie można uruchomić płatności ani pakietu AI. Warsztat bez AI jest dostępny.</p>}
    {status?.trialStatus === 'direct_card_required' && <p role="alert" className="text-amber-200 mt-4">Wpisz kartę bezpośrednio w Stripe, bez Apple Pay lub Google Pay, aby zweryfikować prawo do próby.</p>}
    {status?.subscriptionStatus === 'card_mismatch' && <p role="alert" className="text-amber-200 mt-4">Wybrano inną kartę niż zweryfikowana. Próba została anulowana. Zarejestruj właściwą kartę i spróbuj ponownie.</p>}
    {status?.configured && !active && <div className="mt-6 space-y-5">
      {!status.hasCard ? <button disabled={busy} onClick={() => open('setup')} className="bg-cyan-300 text-slate-950 rounded-xl px-5 py-3 font-semibold disabled:opacity-50">1. Zarejestruj kartę w Stripe</button> : <>
        <p className="text-cyan-200">{status.eligible ? 'Ta karta może otrzymać darmowy start: 7 dni / maks. 500 FC.' : 'Gratis został już wykorzystany dla tego konta lub karty. Dostępny jest płatny abonament: 49 zł od aktywacji.'}</p>
        <label className="flex items-start gap-3 text-sm text-slate-200"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1"/><span>Akceptuję 49 zł miesięcznie za 500 FC i automatyczne odnawianie. {status.eligible ? 'Pierwsza opłata nastąpi po 7 dniach próby, chyba że wcześniej anuluję abonament.' : 'Pierwsza opłata nastąpi przy aktywacji abonamentu.'} Ostateczną cenę i termin potwierdzę w Stripe.</span></label>
        <button disabled={busy || !accepted} onClick={() => open('subscribe')} className="bg-cyan-300 text-slate-950 rounded-xl px-5 py-3 font-semibold disabled:opacity-40">{busy ? 'Otwieram Stripe…' : status.eligible ? '2. Rozpocznij próbę — potem 49 zł/mies.' : '2. Uruchom abonament — 49 zł/mies.'}</button>
        <button disabled={busy} onClick={() => open('setup')} className="block text-sm underline text-slate-400">Zarejestruj inną kartę</button>
      </>}
    </div>}
    {active && <div className="mt-6 space-y-3"><p>Status: <strong>{status?.subscriptionStatus}</strong></p>{status?.accessUntil && <p className="text-slate-300">Dostęp AI do: {new Date(status.accessUntil).toLocaleString('pl-PL')}</p>}{status?.cancelAtPeriodEnd && <p className="text-amber-200">Odnowienie wyłączone. Dostęp zakończy się z końcem bieżącego okresu.</p>}<button disabled={busy} onClick={() => open('portal')} className="border border-white/25 rounded-xl px-5 py-3">Zarządzaj abonamentem / anuluj odnowienie</button></div>}
    {error && <p role="alert" className="text-red-300 mt-5">{error}</p>}
    <a href="/?workshop=1" className="inline-block mt-5 text-sm text-cyan-200 underline">Warsztat bez AI — bez karty</a>
  </section>;
}
