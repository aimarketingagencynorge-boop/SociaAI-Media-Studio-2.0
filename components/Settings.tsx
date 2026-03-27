
import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Instagram, Facebook, Linkedin, Signal, Link2, ExternalLink, MapPin, Phone, Mail, Globe, Key, ShieldCheck, Lock, Save } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';

const TikTokIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Settings: React.FC = () => {
  const { language, socialLinks, toggleSocialLink, webhookUrl, brand, updateBrand, geminiApiKey, setGeminiApiKey, saveUserApiKey } = useStore();
  const t = translations[language];
  const [manualKey, setManualKey] = React.useState(geminiApiKey || '');
  const [isSavingKey, setIsSavingKey] = React.useState(false);
  const [tempWebhook, setTempWebhook] = React.useState(webhookUrl);

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
        <p className="text-white/40 uppercase tracking-widest text-[10px] font-orbitron">{t.settings.desc}</p>
      </header>

      {/* NEURAL LINK CONFIGURATION (API KEYS) */}
      <section className="glass-panel p-8 rounded-[2.5rem] border-magenta-500/20 mb-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-magenta-500/10 text-magenta-500 rounded-xl"><Key size={24} /></div>
            <div>
              <h3 className="font-orbitron text-lg text-white">{t.settings.apiTitle}</h3>
              <p className="text-[9px] font-orbitron text-white/30 uppercase tracking-[0.2em]">{t.settings.apiDesc}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-orbitron text-magenta-500 uppercase tracking-widest block">
                  {t.settings.apiLabel}
                </label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    placeholder={t.settings.apiPlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-magenta-500 transition-all text-xs font-mono pr-12"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-magenta-500 transition-colors" size={16} />
                </div>
              </div>
              <NeonButton 
                variant="purple" 
                className="py-4 text-[10px]"
                onClick={async () => {
                  setIsSavingKey(true);
                  await saveUserApiKey(manualKey);
                  setTimeout(() => setIsSavingKey(false), 1000);
                }}
                disabled={isSavingKey}
              >
                {isSavingKey ? t.settings.apiKeySync : t.settings.apiKeyUpdate}
              </NeonButton>
            </div>

            <div className="flex items-start gap-4 p-4 bg-magenta-500/5 border border-magenta-500/10 rounded-2xl">
              <ShieldCheck size={20} className="text-magenta-500 shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="text-[10px] font-orbitron text-white/80 uppercase tracking-wider">{t.settings.securityProtocol}</p>
                <p className="text-[9px] text-white/30 leading-relaxed">
                  {t.settings.securityDesc}
                </p>
              </div>
            </div>

            {window.aistudio && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] font-orbitron text-white/20 uppercase tracking-widest mb-4">{t.settings.platformIntegration}</p>
                <NeonButton 
                  variant="cyan" 
                  glow={false}
                  className="w-full py-4 text-[10px] opacity-60 hover:opacity-100"
                  onClick={async () => {
                    if (window.aistudio) {
                      await window.aistudio.openSelectKey();
                    }
                  }}
                >
                  {t.settings.selectKey}
                </NeonButton>
              </div>
            )}
          </div>
        </div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-magenta-500/5 rounded-full blur-[80px] pointer-events-none" />
      </section>

      {/* SYSTEM CONFIGURATION */}
      <section className="glass-panel p-8 rounded-[2.5rem] border-[#8C4DFF]/20 mb-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[#8C4DFF]/10 text-[#8C4DFF] rounded-xl"><Globe size={24} /></div>
            <div>
              <h3 className="font-orbitron text-lg text-white">{t.common.language}</h3>
              <p className="text-[9px] font-orbitron text-white/30 uppercase tracking-[0.2em]">System & Content Localization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* UI Language */}
            <div className="space-y-4">
              <label className="text-[10px] font-orbitron text-[#8C4DFF] uppercase tracking-widest block">
                {t.common.uiLanguage}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['PL', 'EN', 'NO', 'RU'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => useStore.getState().setLanguage(lang)}
                    className={`py-3 rounded-xl font-orbitron text-[10px] border transition-all ${
                      language === lang
                        ? 'bg-[#8C4DFF]/20 border-[#8C4DFF] text-white shadow-[0_0_15px_rgba(140,77,255,0.2)]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-white/30 uppercase tracking-wider">
                Affects menus, buttons, and system messages.
              </p>
            </div>

            {/* Content Language */}
            <div className="space-y-4">
              <label className="text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-widest block">
                {t.common.contentLanguage}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['PL', 'EN', 'NO', 'RU'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => updateBrand({ contentLanguage: lang })}
                    className={`py-3 rounded-xl font-orbitron text-[10px] border transition-all ${
                      brand.contentLanguage === lang
                        ? 'bg-[#34E0F7]/20 border-[#34E0F7] text-white shadow-[0_0_15px_rgba(52,224,247,0.2)]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-white/30 uppercase tracking-wider">
                {t.common.contentLanguageDesc}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#8C4DFF]/5 rounded-full blur-[80px] pointer-events-none" />
      </section>

      {/* GLOBAL TRANSMISSION SIGNATURE */}
      <section className="glass-panel p-8 rounded-[2.5rem] border-[#34E0F7]/20 mb-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#34E0F7]/10 text-[#34E0F7] rounded-xl"><Globe size={24} /></div>
              <div>
                <h3 className="font-orbitron text-lg text-white">{t.settings.signatureModule}</h3>
                <p className="text-[9px] font-orbitron text-white/30 uppercase tracking-[0.2em]">{t.settings.signatureProtocol}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-orbitron text-white/60 uppercase tracking-widest">{t.settings.systemStatus}</span>
              <button 
                onClick={() => updateBrand({ signature: { ...brand.signature!, enabled: !brand.signature?.enabled } })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-orbitron text-[10px] uppercase tracking-widest transition-all ${
                  brand.signature?.enabled 
                    ? 'bg-[#34E0F7]/20 text-[#34E0F7] border border-[#34E0F7]/50 shadow-[0_0_15px_rgba(52,224,247,0.2)]' 
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${brand.signature?.enabled ? 'bg-[#34E0F7] animate-pulse' : 'bg-white/20'}`} />
                {brand.signature?.enabled ? t.settings.active : t.settings.disabled}
              </button>
            </div>
          </div>
          
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-500 ${brand.signature?.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
            {/* Left Column: Toggles */}
            <div className="space-y-3">
              <p className="text-[9px] font-orbitron text-[#34E0F7] uppercase tracking-widest mb-4 border-b border-[#34E0F7]/20 pb-2">{t.settings.visibility}</p>
              
              {[
                { id: 'showBrandName', label: t.settings.brandName },
                { id: 'showAddress', label: t.settings.address },
                { id: 'showPhone', label: t.settings.phone },
                { id: 'showEmail', label: t.settings.email },
                { id: 'showCtaLink', label: t.settings.ctaLink },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-[#34E0F7]/30 transition-all group">
                  <span className="text-[10px] font-orbitron text-white/60 uppercase tracking-widest">{item.label}</span>
                  <button 
                    onClick={() => updateBrand({ signature: { ...brand.signature!, [item.id]: !brand.signature?.[item.id as keyof typeof brand.signature] } })}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${brand.signature?.[item.id as keyof typeof brand.signature] ? 'bg-[#34E0F7]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${brand.signature?.[item.id as keyof typeof brand.signature] ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Middle & Right Column: Inputs */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-white/40 uppercase tracking-widest"><MapPin size={12}/> {t.settings.addressLabel}</label>
                <input 
                  type="text" 
                  value={brand.address || ''} 
                  onChange={(e) => updateBrand({ address: e.target.value })}
                  placeholder={t.settings.addressPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#34E0F7] transition-all text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-white/40 uppercase tracking-widest"><Phone size={12}/> {t.settings.phoneLabel}</label>
                <input 
                  type="text" 
                  value={brand.phone || ''} 
                  onChange={(e) => updateBrand({ phone: e.target.value })}
                  placeholder={t.settings.phonePlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#34E0F7] transition-all text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-white/40 uppercase tracking-widest"><Mail size={12}/> {t.settings.emailLabel}</label>
                <input 
                  type="email" 
                  value={brand.email || ''} 
                  onChange={(e) => updateBrand({ email: e.target.value })}
                  placeholder={t.settings.emailPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#34E0F7] transition-all text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-white/40 uppercase tracking-widest"><Link2 size={12}/> {t.settings.ctaLabel}</label>
                <input 
                  type="text" 
                  value={brand.ctaLink || ''} 
                  onChange={(e) => updateBrand({ ctaLink: e.target.value })}
                  placeholder={t.settings.ctaPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#34E0F7] transition-all text-xs font-mono"
                />
              </div>
              
              <div className="md:col-span-2 p-4 bg-[#34E0F7]/5 border border-[#34E0F7]/10 rounded-2xl">
                <p className="text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Signal size={12} className="animate-pulse" /> {t.settings.previewTitle}
                </p>
                <div className="text-[10px] font-mono text-white/40 leading-relaxed">
                  IF (signature.enabled) THEN APPEND [
                    {brand.signature?.showBrandName && `"${brand.name}" `}
                    {brand.signature?.showAddress && brand.address && `| ${brand.address} `}
                    {brand.signature?.showPhone && brand.phone && `| ${brand.phone} `}
                    {brand.signature?.showEmail && brand.email && `| ${brand.email} `}
                    {brand.signature?.showCtaLink && brand.ctaLink && `| ${brand.ctaLink}`}
                  ] TO ALL TRANSMISSIONS
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-8 pt-6 border-t border-white/5 text-[9px] font-orbitron text-[#34E0F7]/40 uppercase tracking-[0.3em] text-center">
            {t.settings.hubFooter}
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
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Target Webhook URL</label>
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <input 
                    type="text" 
                    value={tempWebhook}
                    onChange={(e) => setTempWebhook(e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#8C4DFF] transition-all text-xs font-mono"
                  />
                </div>
                <button 
                  onClick={() => useStore.getState().setWebhookUrl(tempWebhook)}
                  className="p-4 bg-[#8C4DFF]/20 text-[#8C4DFF] rounded-xl border border-[#8C4DFF]/50 hover:bg-[#8C4DFF]/30 transition-all"
                >
                  <Save size={20} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-orbitron">
              {t.settings.zapierDesc}
            </p>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C4DFF]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </section>
    </div>
  );
};

export default Settings;
