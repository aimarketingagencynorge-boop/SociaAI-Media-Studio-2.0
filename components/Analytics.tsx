import React from 'react';
import { useStore } from '../store';
import { translations } from '../i18n';

export default function Analytics() {
  const { language, posts, mediaAssets, studioAssets, integrations } = useStore();
  const metrics = [
    ['Posty w stacji', posts.length],
    ['Gotowe do eksportu', posts.filter(p => p.isApproved).length],
    ['Materiały w bibliotece', mediaAssets.length + studioAssets.length],
    ['Aktywne integracje', integrations.filter(i => i.isEnabled).length],
  ];
  return <div className="p-8 max-w-7xl mx-auto space-y-8">
    <h2 className="font-orbitron text-3xl text-[#C74CFF]">{translations[language].analytics.title}</h2>
    <p className="text-white/70">Stan Twojej pracy w SociAI Studio.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map(([label, value]) => <div key={label} className="glass-panel p-6 rounded-3xl border-cyan-400/20">
        <p className="font-orbitron text-4xl text-cyan-300">{value}</p><p className="mt-3 text-white/70">{label}</p>
      </div>)}
    </div>
    <div className="glass-panel p-8 rounded-3xl text-white/60">
      Zasięgi, wyświetlenia i zaangażowanie nie są jeszcze pobierane z platform społecznościowych.
      Po publikacji sprawdzisz je w statystykach danego konta.
    </div>
  </div>;
}
