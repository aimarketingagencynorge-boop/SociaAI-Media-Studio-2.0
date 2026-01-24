
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Shield, 
  Mic2, 
  Hexagon, 
  CloudUpload, 
  Trash2, 
  Sparkles, 
  Smile, 
  Zap, 
  BookOpen, 
  Target, 
  Users, 
  Image as ImageIcon, 
  CheckCircle2, 
  Dna, 
  Save, 
  Rocket,
  Plus,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Globe,
  FileText
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import NeonButton from './NeonButton';
import { BrandAsset, Language } from '../types';

const YodaIcon = ({ active }: { active: boolean }) => (
  <motion.svg 
    width="24" height="24" viewBox="0 0 24 24" fill="none" 
    animate={{ filter: active ? 'drop-shadow(0 0 8px #C74CFF)' : 'none' }}
    className={`transition-colors duration-500 ${active ? 'text-[#C74CFF]' : 'text-white/20'}`}
  >
    <path d="M12 4C10 4 8 5 7 6C5 4 2 4 2 4C2 4 4 7 5 9C4 11 4 13 5 15C6 17 8 18 12 18C16 18 18 17 19 15C20 13 20 11 19 9C20 7 22 4 22 4C22 4 19 4 17 6C16 5 14 4 12 4Z" fill="currentColor" opacity={active ? 1 : 0.3} />
    <path d="M9 11C9 11 10 10 12 10C14 10 15 11 15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </motion.svg>
);

const BrandKit: React.FC = () => {
  const { 
    language, 
    brand, 
    updateBrand, 
    addBrandAsset, 
    removeBrandAsset, 
    updateBrandAssetTag 
  } = useStore();
  
  const t = translations[language];
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const consistencyScore = useMemo(() => {
    let score = 0;
    if (brand.logos?.main) score += 15;
    const assetScore = (brand.assets?.length || 0) * 3;
    score += Math.min(assetScore, 30);
    if (brand.voiceProfile) score += 10;
    if (brand.coreMission && brand.coreMission.length > 10) score += 10;
    if (brand.description && brand.description.length > 30) score += 10;
    if (brand.pillars?.every(p => p.length > 2)) score += 15;
    if (brand.isYodaMode) score += 10;
    return Math.min(score, 100);
  }, [brand]);

  const handleLogoUpload = (type: 'main' | 'light' | 'dark', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBrand({ logos: { ...brand.logos, [type]: reader.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSyncDNA = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  const voiceProfiles = [
    { id: 'premium', label: 'Premium & Calm', icon: <Sparkles size={18} />, desc: 'Luksus i spokój.' },
    { id: 'warm', label: 'Warm Host', icon: <Smile size={18} />, desc: 'Gościnność i ciepło.' },
    { id: 'modern', label: 'Modern & Bold', icon: <Zap size={18} />, desc: 'Dynamika i konkret.' },
    { id: 'storyteller', label: 'Storyteller', icon: <BookOpen size={18} />, desc: 'Emocje i opowieści.' },
    { id: 'corporate', label: 'Corporate & Clean', icon: <Target size={18} />, desc: 'B2B i klarowność.' }
  ];

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar relative bg-transparent">
      <div className="p-8 lg:p-12 max-w-[1500px] mx-auto space-y-16 pb-48">
        
        {/* HUD HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 glass-panel p-10 rounded-[2rem] border-white/10 relative overflow-hidden bg-black/40 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#34E0F7]/5 via-transparent to-[#8C4DFF]/5 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <h2 className="text-4xl md:text-5xl font-black font-orbitron tracking-tight text-white leading-none">
              SociAI MediA Studio : <span className="text-[#34E0F7]">Brand Kit</span>
            </h2>
            <p className="text-white/20 uppercase tracking-[0.4em] text-[9px] font-orbitron font-bold">DNA Sync Mode: {brand.missionLanguage}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 w-full xl:w-auto">
             <div className="flex flex-col items-end gap-3 min-w-[200px]">
                <div className="flex items-center gap-4">
                   <span className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest font-black">DNA Consistency</span>
                   <span className="text-5xl font-black font-orbitron text-[#34E0F7] shadow-sm">{consistencyScore}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${consistencyScore}%` }} className="h-full bg-gradient-to-r from-[#8C4DFF] to-[#34E0F7]" />
                </div>
             </div>
             <NeonButton variant="purple" onClick={handleSyncDNA} disabled={isSyncing}>
                {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />} SYNC DNA
             </NeonButton>
          </div>
        </header>

        {/* VOICE & YODA */}
        <section className="glass-panel p-12 rounded-[3rem] border-white/10 flex flex-col space-y-12 bg-black/20 shadow-2xl">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-8">
             <div className="flex items-center gap-5">
               <div className="p-4 bg-[#C74CFF]/10 rounded-2xl border border-[#C74CFF]/20">
                  <Mic2 size={24} className="text-[#C74CFF]" />
               </div>
               <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">Profil Głosu (Voice Architect)</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Tonacja i unikalny styl wypowiedzi</p>
               </div>
             </div>

             <div className="flex items-center gap-4 bg-[#C74CFF]/5 border border-[#C74CFF]/30 p-4 rounded-2xl cursor-pointer hover:bg-[#C74CFF]/10 transition-all" onClick={() => updateBrand({ isYodaMode: !brand.isYodaMode })}>
                <YodaIcon active={brand.isYodaMode} />
                <div className="flex flex-col">
                  <span className={`text-[10px] font-orbitron uppercase tracking-widest font-black ${brand.isYodaMode ? 'text-[#C74CFF]' : 'text-white/40'}`}>YODA_STYLE_OVERRIDE</span>
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Master Yoda grammar mode</span>
                </div>
                <div className={`ml-4 w-10 h-5 rounded-full relative transition-colors ${brand.isYodaMode ? 'bg-[#C74CFF]' : 'bg-white/10'}`}>
                   <motion.div animate={{ x: brand.isYodaMode ? 20 : 2 }} className="absolute top-1 w-3 h-3 bg-white rounded-full" />
                </div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {voiceProfiles.map((v) => (
                <button key={v.id} onClick={() => updateBrand({ voiceProfile: v.id as any })} className={`group relative p-8 rounded-[2rem] border transition-all duration-700 overflow-hidden flex flex-col items-center text-center gap-5 ${brand.voiceProfile === v.id ? 'border-[#C74CFF] bg-[#C74CFF]/10 text-white shadow-[0_0_40px_rgba(199,76,255,0.15)]' : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/20'}`}>
                   <div className={`p-4 rounded-full ${brand.voiceProfile === v.id ? 'bg-[#C74CFF] text-white' : 'bg-white/5 text-white/20'}`}>
                      {v.icon}
                   </div>
                   <div className="space-y-2">
                      <div className="text-[11px] font-orbitron uppercase tracking-[0.2em] font-black">{v.label}</div>
                      <div className="text-[9px] font-inter opacity-60 leading-tight">{v.desc}</div>
                   </div>
                </button>
              ))}
           </div>
        </section>

        {/* DNA INTEL - DESCRIPTION & MISSION */}
        <section className="glass-panel rounded-[3rem] border-white/10 overflow-hidden flex flex-col bg-black/40 border-l-4 border-l-[#34E0F7] shadow-2xl">
          <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <div className="flex items-center gap-5">
                <div className="p-4 bg-[#34E0F7]/10 rounded-2xl border border-[#34E0F7]/20">
                  <Dna size={24} className="text-[#34E0F7]" />
                </div>
                <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">DNA INTEL: SZCZEGÓŁY KONSTRUKCJI</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Główna charakterystyka marki</p>
                </div>
             </div>
          </div>

          <div className="p-10 space-y-12">
             <div className="space-y-4 max-w-3xl">
                <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-3 font-black">
                  <FileText size={16} className="text-[#34E0F7]"/> Pełny Opis Marki (Brand Bio)
                </label>
                <textarea 
                  value={brand.description}
                  onChange={(e) => updateBrand({ description: e.target.value })}
                  placeholder="Opis wyekstrahowany ze skanu strony..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[13px] font-inter focus:border-[#34E0F7] outline-none transition-all shadow-inner text-white/80 min-h-[160px] resize-none"
                />
             </div>

             <div className="space-y-4 max-w-3xl">
                <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-3 font-black">
                  <Target size={16} className="text-[#34E0F7]"/> Misja w jednym zdaniu
                </label>
                <input type="text" value={brand.coreMission} onChange={(e) => updateBrand({ coreMission: e.target.value })} placeholder="Główny cel Twojej marki..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[13px] font-inter focus:border-[#34E0F7] outline-none transition-all text-white/80" />
             </div>

             <div className="space-y-4">
                <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-3 font-black">
                  <Hexagon size={16} className="text-[#34E0F7]"/> Filary Marki
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(brand.pillars || ['', '', '']).map((p, i) => (
                    <div key={i} className="relative">
                      <input type="text" value={p} onChange={(e) => {
                          const newPillars = [...(brand.pillars || ['', '', ''])];
                          newPillars[i] = e.target.value;
                          updateBrand({ pillars: newPillars });
                        }} placeholder={`Filar 0${i+1}`} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all text-white/80 pl-12" />
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-orbitron text-[#34E0F7]/40 font-black">0{i+1}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="p-10 border-t border-white/5 bg-black/80 flex items-center justify-between">
             <NeonButton variant="cyan" onClick={handleSyncDNA} disabled={isSyncing}>
                {isSyncing ? <RefreshCw className="animate-spin" /> : <Save size={20} />} ZAPISZ DNA
             </NeonButton>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BrandKit;
