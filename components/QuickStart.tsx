import React, { useState } from 'react';
import { Rocket } from 'lucide-react';
import { useStore } from '../store';
import { db } from '../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { WORKSHOP_STORAGE_KEY } from '../workshop';
import { STARTER_CREDITS } from '../launchOffer';
import type { Language, Platform } from '../types';

export default function QuickStart({ onAdvanced }: { onAdvanced: () => void }) {
  const { brand, userId, updateBrand, setOnboardingStep, setActiveView } = useStore();
  const [seed] = useState(() => { try { return JSON.parse(localStorage.getItem(WORKSHOP_STORAGE_KEY) || '{}') || {}; } catch { return {}; } });
  const [name, setName] = useState(brand.name || (typeof seed.name === 'string' ? seed.name : ''));
  const [offer, setOffer] = useState(brand.description || (typeof seed.offer === 'string' ? seed.offer : ''));
  const [audience, setAudience] = useState(typeof seed.audience === 'string' ? seed.audience : '');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [language, setLanguage] = useState<Language>(brand.contentLanguage || 'PL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const input = 'w-full mt-2 bg-[#111528] border border-white/15 rounded-xl p-3 text-white focus:ring-2 focus:ring-cyan-400 outline-none';
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (saving || !userId) return;
    if (!name.trim() || !offer.trim() || !audience.trim()) { setError('Uzupełnij nazwę, ofertę i odbiorców.'); return; }
    setSaving(true); setError('');
    const next = { ...brand, name: name.trim(), description: offer.trim(), whatWeDo: offer.trim(), coreMission: `Pomagamy: ${audience.trim()}`, contentLanguage: language,
      platformDNA: { ...brand.platformDNA, [platform]: { positioning: offer.trim(), contentFocus: audience.trim(), visualDirection: 'Czytelne grafiki, spójna paleta marki', goal: 'Budowanie zainteresowania ofertą' } },
      pillars: ['Praktyczne wskazówki', 'Oferta i sposób pracy', 'Rozmowa z odbiorcami'] };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', userId, 'brands', 'default'), JSON.parse(JSON.stringify(next)), { merge: true });
      batch.set(doc(db, 'users', userId), { onboardingStep: 0 }, { merge: true });
      await batch.commit();
      updateBrand(next, true); setOnboardingStep(0, true); setActiveView('dashboard');
    } catch { setError('Nie udało się zapisać marki. Spróbuj ponownie — formularz pozostaje uzupełniony.'); }
    finally { setSaving(false); }
  };
  return <main className="relative z-10 min-h-screen bg-[#070915] text-white p-5 flex justify-center items-center"><form onSubmit={submit} className="w-full max-w-2xl border border-white/10 rounded-3xl bg-white/[.03] p-6 md:p-10 space-y-5">
    <p className="text-cyan-300 font-mono text-xs tracking-widest">SOCIAI / PRZYGOTOWANIE DO STARTU</p><h1 className="text-3xl font-bold">Dokąd leci Twoja marka?</h1><p className="text-slate-400">Trzy odpowiedzi wystarczą, żeby zacząć. Szczegóły, logo i referencje dodasz później w DNA marki. Pakiet {STARTER_CREDITS} FC na 7 dni aktywujesz po rejestracji karty i akceptacji abonamentu. Ten formularz nie zużywa kredytów.</p>
    <label className="block text-sm">Nazwa marki<input required maxLength={80} className={input} value={name} onChange={e => setName(e.target.value)}/></label>
    <label className="block text-sm">Co robisz lub sprzedajesz?<textarea required maxLength={1500} rows={3} className={input} value={offer} onChange={e => setOffer(e.target.value)} placeholder="Np. prowadzę studio jogi i zajęcia dla początkujących"/></label>
    <label className="block text-sm">Do kogo chcesz dotrzeć?<input required maxLength={500} className={input} value={audience} onChange={e => setAudience(e.target.value)} placeholder="Np. osoby pracujące przy biurku w Gliwicach"/></label>
    <div className="grid sm:grid-cols-2 gap-4"><label className="block text-sm">Główna planeta<select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className={input}>{['instagram', 'linkedin', 'facebook', 'tiktok', 'youtube', 'twitter'].map(p => <option key={p} value={p}>{p === 'twitter' ? 'X / Twitter' : p}</option>)}</select></label><label className="block text-sm">Język treści<select value={language} onChange={e => setLanguage(e.target.value as Language)} className={input}><option value="PL">Polski</option><option value="EN">English</option><option value="NO">Norsk</option><option value="RU">Русский</option></select></label></div>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    <button disabled={saving} className="w-full rounded-xl bg-cyan-300 text-slate-950 font-bold p-4 flex gap-2 justify-center disabled:opacity-50"><Rocket size={20}/>{saving ? 'Zapisywanie…' : 'Wejdź do swojego kokpitu'}</button>
    <button type="button" onClick={onAdvanced} className="w-full text-sm text-slate-400 underline">Wolę pełny konfigurator i skan strony</button>
  </form></main>;
}
