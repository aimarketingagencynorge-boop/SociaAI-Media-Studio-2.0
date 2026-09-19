import React, { useState } from 'react';
import { ArrowLeft, Download, Rocket, Copy, Check, Share2 } from 'lucide-react';
import { missions, workshopPost, graphicSvg, downloadGraphic, saveDownload, WORKSHOP_STORAGE_KEY, type WorkshopBrief } from '../workshop';
import { STARTER_CREDITS } from '../launchOffer';

export default function Workshop({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const [brief, setBrief] = useState<WorkshopBrief>(() => {
    try { const value = JSON.parse(localStorage.getItem(WORKSHOP_STORAGE_KEY) || 'null'); if (value && ['name', 'offer', 'audience'].every(k => typeof value[k] === 'string')) return value; } catch {}
    return { name: 'Moje Studio', offer: 'Pomagam tworzyć lepsze zdjęcia telefonem', audience: 'osoby rozwijające małą markę' };
  });
  const [day, setDay] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [headline, setHeadline] = useState('Twój pomysł. Pierwszy krok.');
  const [color, setColor] = useState('#34e0f7');
  const [portrait, setPortrait] = useState(false);
  const [message, setMessage] = useState('');
  const [downloading, setDownloading] = useState(false);
  const caption = drafts[day] ?? workshopPost(brief, day);
  const svg = graphicSvg(brief.name, headline, color, portrait);
  const updateBrief = (field: keyof WorkshopBrief, value: string) => {
    const next = { ...brief, [field]: value }; setBrief(next);
    try { localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(next)); } catch {}
  };
  const copy = async (value: string, success: string) => {
    try { await navigator.clipboard.writeText(value); setMessage(success); }
    catch { setMessage('Kopiowanie jest niedostępne. Zaznacz tekst lub pobierz plik.'); }
  };
  const input = 'w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400';
  return <main className="relative z-10 min-h-screen bg-[#070915] text-white px-4 py-6 md:px-10">
    <div className="max-w-6xl mx-auto">
      <nav className="flex items-center justify-between gap-3 mb-10"><button onClick={onClose} className="flex items-center gap-2 text-slate-300"><ArrowLeft size={18}/> SociAI Studio</button><button onClick={() => copy(`${window.location.origin}/?workshop=1`, 'Link do warsztatu skopiowany.')} className="flex items-center gap-2 text-cyan-300"><Share2 size={18}/> Poleć warsztat</button></nav>
      <span className="text-xs font-mono tracking-widest text-cyan-300">PIERWSZA MISJA / WARSZTAT BEZ AI</span>
      <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Twój pierwszy post. Twoja grafika.</h1>
      <p className="text-slate-400 max-w-2xl mb-8">Wypróbuj edytowalne szablony bez konta i bez kredytów. To warsztat oparty na szablonach — własne teksty i obrazy z AI stworzysz po zalogowaniu.</p>
      <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-7 space-y-5">
          <h2 className="text-xl font-semibold">1. Ustaw kurs swojej marki</h2>
          <label className="block text-sm text-slate-300">Nazwa marki<input className={`${input} mt-2`} value={brief.name} maxLength={35} onChange={e => updateBrief('name', e.target.value)}/></label>
          <label className="block text-sm text-slate-300">Co oferujesz?<textarea className={`${input} mt-2`} rows={2} maxLength={300} value={brief.offer} onChange={e => updateBrief('offer', e.target.value)}/></label>
          <label className="block text-sm text-slate-300">Dla kogo?<input className={`${input} mt-2`} maxLength={200} value={brief.audience} onChange={e => updateBrief('audience', e.target.value)}/></label>
          <p className="text-xs text-slate-500">Ten brief zostaje w tej przeglądarce. Edycje postów i grafiki są przechowywane do zamknięcia warsztatu — pobierz je przed wyjściem.</p>
          <h2 className="text-xl font-semibold pt-4">2. Wybierz misję na dziś</h2>
          <div className="flex flex-wrap gap-2">{missions.map(([title], i) => <button key={title} onClick={() => setDay(i)} aria-pressed={day === i} className={`rounded-xl px-3 py-2 text-sm border ${day === i ? 'border-cyan-300 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-slate-400'}`}>{i + 1}. {title}</button>)}</div>
          <p className="text-sm text-cyan-200">{missions[day][1]}</p>
          <label className="block text-sm text-slate-300">Treść posta<textarea className={`${input} mt-2 leading-relaxed`} rows={9} maxLength={5000} value={caption} onChange={e => setDrafts({ ...drafts, [day]: e.target.value })}/></label>
          <p className="text-xs text-slate-400">Uzupełnij fragmenty w nawiasach. Jeden post = jedna myśl i jedno wezwanie do działania.</p>
          <div className="flex flex-wrap gap-3"><button className="rounded-xl bg-cyan-300 text-slate-950 font-semibold px-4 py-3 flex gap-2 items-center" onClick={() => copy(caption, 'Treść posta skopiowana.')}><Copy size={16}/> Kopiuj post</button><button className="rounded-xl border border-white/15 px-4 py-3 flex gap-2 items-center" onClick={() => saveDownload(new Blob([missions.map(([title], i) => `${i + 1}. ${title}\n\n${drafts[i] ?? workshopPost(brief, i)}`).join('\n\n———\n\n')], { type: 'text/plain;charset=utf-8' }), 'sociai-plan-7-postow.txt')}><Download size={16}/> Pobierz 7 szkiców</button></div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-7 space-y-5">
          <h2 className="text-xl font-semibold">3. Nadaj pomysłowi kształt</h2>
          <label className="block text-sm text-slate-300">Nagłówek grafiki<input className={`${input} mt-2`} maxLength={100} value={headline} onChange={e => setHeadline(e.target.value)}/></label>
          <div className="flex items-center gap-5"><label className="flex items-center gap-3 text-sm text-slate-300">Kolor<input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-12 bg-transparent cursor-pointer"/></label><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={portrait} onChange={e => setPortrait(e.target.checked)}/> Pionowy 4:5</label></div>
          <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`Podgląd grafiki marki ${brief.name}`} className="w-full max-h-[490px] object-contain rounded-xl bg-[#090b19]"/>
          <button disabled={downloading} className="rounded-xl bg-cyan-300 text-slate-950 font-semibold px-5 py-3 flex gap-2 items-center disabled:opacity-50" onClick={async () => { setDownloading(true); try { await downloadGraphic(svg); setMessage('Grafika PNG gotowa do pobrania.'); } catch (e) { setMessage((e as Error).message); } finally { setDownloading(false); } }}><Download size={17}/> {downloading ? 'Przygotowanie…' : 'Pobierz grafikę PNG'}</button>
          <p className="text-xs text-slate-400">1080 × {portrait ? '1350' : '1080'} px · Bez znaku wodnego · Szablon graficzny</p>
        </section>
      </div>
      <p role="status" className="min-h-8 py-4 text-cyan-200">{message}</p>
      <section className="mt-4 mb-12 rounded-3xl border border-violet-400/30 bg-violet-500/10 p-7 md:p-10 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center"><div><p className="text-violet-300 text-sm flex gap-2 items-center"><Check size={16}/> Gotowy na własną misję?</p><h2 className="text-2xl font-bold mt-2">{STARTER_CREDITS} kredytów na start z AI</h2><p className="text-slate-400 mt-2 max-w-xl">Własne DNA marki, nowe treści i generowane obrazy. Karta wymagana: 7 dni / maks. 500 FC gratis, potem 49 zł miesięcznie za 500 FC. Brief z warsztatu wykorzystasz przy zakładaniu marki.</p></div><button onClick={onStart} className="shrink-0 rounded-xl bg-violet-500 px-6 py-4 font-semibold flex gap-2 items-center"><Rocket size={18}/> Rozpocznij z AI</button></section>
    </div>
  </main>;
}
