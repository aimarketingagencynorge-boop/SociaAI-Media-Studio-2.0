
import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Instagram, Facebook, Linkedin, Signal, Link2, ExternalLink, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import NeonButton from './NeonButton';

const TikTokIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Settings: React.FC = () => {
  const { language, socialLinks, toggleSocialLink, webhookUrl, brand, updateBrand } = useStore();
  const t = translations[language];

  const platforms = [
    { id: 'instagram', icon: <Instagram size={20} />, label: 'Instagram' },
    { id: 'facebook', icon: <Facebook size={20} />, label: 'Facebook' },
    { id: 'tiktok', icon: <TikTokIcon size={20} />, label: 'TikTok' },
    { id: 'linkedin', icon: <Linkedin size={20} />, label: 'LinkedIn' },
  ];

  return (
    <div className="p-8 pb-24 max-w-5xl mx-auto">
      <header className="mb-12">
        <h2 className="text-4xl font-black font-orbitron mb-2 tracking-tight text-[#8C4DFF]">
          {t.settings.title}
        </h2>
        <p className="text-white/40 uppercase tracking-widest text-[10px] font-orbitron">Konfiguracja Łączności Międzyplanetarnej</p>
      </header>

      {/* GLOBAL TRANSMISSION SIGNATURE */}
      <section className="glass-panel p-8 rounded-[2.5rem] border-[#34E0F7]/20 mb-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[#34E0F7]/10 text-[#34E0F7] rounded-xl"><Globe size={24} /></div>
            <h3 className="font-orbitron text-lg text-white">GLOBALNY SCHEMAT TRANSMISJI (SIGNATURE)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-orbitron text-white/40 uppercase tracking-widest"><MapPin size={12}/> Adres</label>
              <input 
                type="text" 
                value={brand.address || ''} 
                onChange={(e) => updateBrand({ address: e.target.value })}
                placeholder="Np. ul. Warszawska 1, 00-001 Warszawa"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#34E0F7] transition-all text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-orbitron text-white/40 uppercase tracking-widest"><Phone size={12}/> Telefon</label>
              <input 
                type="text" 
                value={brand.phone || ''} 
                onChange={(e) => updateBrand({ phone: e.target.value })}
                placeholder="+48 000 000 000"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#34E0F7] transition-all text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-orbitron text-white/40 uppercase tracking-widest"><Mail size={12}/> Email</label>
              <input 
                type="email" 
                value={brand.email || ''} 
                onChange={(e) => updateBrand({ email: e.target.value })}
                placeholder="kontakt@twojamarka.pl"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#34E0F7] transition-all text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-orbitron text-white/40 uppercase tracking-widest"><Link2 size={12}/> Link / CTA</label>
              <input 
                type="text" 
                value={brand.ctaLink || ''} 
                onChange={(e) => updateBrand({ ctaLink: e.target.value })}
                placeholder="https://twoja-strona.pl/sklep"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#34E0F7] transition-all text-xs"
              />
            </div>
          </div>
          <p className="mt-6 text-[9px] font-orbitron text-[#34E0F7]/40 uppercase tracking-widest italic">
            Wskazówka: Dane te zostaną automatycznie dopisane do każdej transmisji AI Studio.
          </p>
        </div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#34E0F7]/5 rounded-full blur-[80px] pointer-events-none" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {platforms.map(p => {
          const isConnected = socialLinks[p.id];
          return (
            <motion.div 
              key={p.id}
              className={`glass-panel p-6 rounded-3xl border-white/5 flex flex-col justify-between transition-all duration-500 ${isConnected ? 'border-[#34E0F7]/30 shadow-[0_0_20px_rgba(52,224,247,0.05)]' : ''}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${isConnected ? 'bg-[#34E0F7]/10 text-[#34E0F7]' : 'bg-white/5 text-white/20'} transition-all`}>
                  {p.icon}
                </div>
                <div className="flex items-center gap-2">
                   {isConnected ? (
                     <>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34E0F7] animate-pulse glow-cyan" />
                        <span className="text-[10px] font-orbitron text-[#34E0F7] uppercase">{t.settings.signalStrong}</span>
                     </>
                   ) : (
                     <span className="text-[10px] font-orbitron text-white/20 uppercase">{t.settings.signalNone}</span>
                   )}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-orbitron text-sm uppercase mb-1 tracking-widest">{p.label} Satellite</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{isConnected ? 'ID: 402-DELTA-LINK' : 'READY_FOR_UPSTREAM'}</p>
              </div>

              <NeonButton 
                variant={isConnected ? 'purple' : 'cyan'} 
                className="w-full py-4 text-xs"
                onClick={() => toggleSocialLink(p.id)}
              >
                {isConnected ? t.settings.disconnect : t.settings.linkSatellite}
              </NeonButton>
            </motion.div>
          );
        })}
      </div>

      <section className="glass-panel p-8 rounded-[2.5rem] border-[#8C4DFF]/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#8C4DFF]/10 text-[#8C4DFF] rounded-xl"><Link2 size={24} /></div>
            <h3 className="font-orbitron text-lg text-white">{t.settings.zapierTitle}</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between group">
               <div className="flex-1 mr-4 overflow-hidden">
                 <p className="text-[8px] font-orbitron text-white/20 mb-1 uppercase tracking-widest">Target Webhook</p>
                 <p className="text-xs font-mono text-[#8C4DFF] truncate">{webhookUrl}</p>
               </div>
               <button className="p-3 hover:bg-[#8C4DFF]/10 text-white/20 hover:text-[#8C4DFF] rounded-xl transition-all">
                  <ExternalLink size={18} />
               </button>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-orbitron">
              Automatyczna synchronizacja postów z Twoim ekosystemem Zapier. Każda udana transmisja AI Studio zostanie skierowana pod ten adres.
            </p>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C4DFF]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </section>
    </div>
  );
};

export default Settings;
