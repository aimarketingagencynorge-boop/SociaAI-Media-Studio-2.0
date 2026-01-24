
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

  // PROTOKÓŁ OBLICZANIA CONSISTENCY SCORE
  const consistencyScore = useMemo(() => {
    let score = 0;
    if (brand.logos?.main) score += 15;
    if (brand.logos?.light) score += 5;
    if (brand.logos?.dark) score += 5;
    const assetScore = (brand.assets?.length || 0) * 3;
    score += Math.min(assetScore, 30);
    if (brand.voiceProfile) score += 10;
    if (brand.coreMission && brand.coreMission.length > 10) score += 10;
    if (brand.pillars?.every(p => p.length > 2)) score += 15;
    if (brand.dictionary?.keywords?.length > 0) score += 5;
    if (brand.humanTouch && brand.humanTouch.length > 5) score += 5;
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

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && brand.assets.length < 10) {
      const reader = new FileReader();
      reader.onloadend = () => {
        addBrandAsset({
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result as string,
          tag: 'PRODUKT'
        });
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

  const languages: Language[] = ['PL', 'EN', 'NO', 'RU'];

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar relative bg-transparent">
      <div className="p-8 lg:p-12 max-w-[1500px] mx-auto space-y-16 pb-48">
        
        {/* HUD HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 glass-panel p-10 rounded-[2rem] border-white/10 relative overflow-hidden bg-black/40 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#34E0F7]/5 via-transparent to-[#8C4DFF]/5 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-4 text-[10px] font-mono text-[#34E0F7] uppercase tracking-[0.5em] font-black mb-1">
               <ShieldCheck size={14} /> DNA_SYNC: {isSyncing ? 'SYNCHRONIZING...' : 'OPERATIONAL'} | MISSION_LANG: {brand.missionLanguage}
            </div>
            <h2 className="text-4xl md:text-5xl font-black font-orbitron tracking-tight text-white leading-none">
              SociAI MediA Studio : <span className="text-[#34E0F7]">Brand Kit</span>
            </h2>
            <p className="text-white/20 uppercase tracking-[0.4em] text-[9px] font-orbitron font-bold">Ship's DNA: Structural Archive Module v2.5</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 w-full xl:w-auto">
             <div className="flex flex-col items-end gap-3 min-w-[200px]">
                <div className="flex items-center gap-4">
                   <span className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest font-black">Consistency Score</span>
                   <span className="text-5xl font-black font-orbitron text-[#34E0F7] shadow-sm">{consistencyScore}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${consistencyScore}%` }}
                     className="h-full bg-gradient-to-r from-[#8C4DFF] to-[#34E0F7] shadow-[0_0_15px_rgba(52,224,247,0.5)]"
                   />
                </div>
             </div>
             <NeonButton variant="purple" className={`px-10 py-5 flex items-center gap-4 text-sm font-black tracking-[0.1em] border-2 shadow-[0_0_30px_rgba(140,77,255,0.2)] ${isSyncing ? 'opacity-50' : ''}`} onClick={handleSyncDNA} disabled={isSyncing}>
                {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} className="fill-current" />}
                {isSyncing ? 'SYNCHRONIZACJA...' : 'SYNCHRONIZUJ DNA MARKI'}
             </NeonButton>
          </div>
        </header>

        {/* LOGO & ASSETS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <section className="lg:col-span-4 glass-panel p-10 rounded-[2.5rem] border-white/10 flex flex-col space-y-8 bg-black/20">
             <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <Shield size={22} className="text-[#8C4DFF] glow-purple" />
                <h3 className="font-orbitron text-xs uppercase tracking-[0.4em] font-black text-white">Logo Vault</h3>
             </div>
             <div className="grid grid-cols-1 gap-8">
                {[
                  { id: 'main', label: 'LOGO GŁÓWNE', desc: 'Domyślny wariant systemowy' },
                  { id: 'light', label: 'LOGO JASNE', desc: 'Używane na ciemnych tłach' },
                  { id: 'dark', label: 'LOGO CIEMNE', desc: 'Sygnet / Ikona aplikacji' }
                ].map((l) => (
                  <div key={l.id} className="group relative">
                    <label className="text-[9px] font-orbitron text-white/40 uppercase tracking-widest mb-3 block font-bold">{l.label}</label>
                    <div className={`h-40 glass-panel border-2 border-dashed rounded-2xl relative overflow-hidden flex items-center justify-center transition-all cursor-pointer ${ (brand.logos as any)?.[l.id] ? 'border-[#8C4DFF]/30 bg-[#8C4DFF]/5' : 'border-white/5 bg-white/[0.02] hover:border-[#8C4DFF]/40'}`}>
                       {(brand.logos as any)?.[l.id] ? (
                         <>
                           <img src={(brand.logos as any)[l.id]} className="max-w-[75%] max-h-[75%] object-contain p-4 glow-cyan" alt={l.label} />
                           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <div className="text-[9px] font-orbitron text-[#34E0F7] uppercase tracking-widest">[✓ SYNC]</div>
                              <button onClick={() => updateBrand({ logos: { ...brand.logos, [l.id]: undefined } })} className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                           </div>
                         </>
                       ) : (
                         <div className="flex flex-col items-center gap-3 text-white/10 group-hover:text-[#8C4DFF] transition-colors">
                            <CloudUpload size={28} />
                            <span className="text-[9px] font-orbitron uppercase tracking-[0.2em] font-bold">UPLOAD_LOGO</span>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleLogoUpload(l.id as any, e)} />
                         </div>
                       )}
                    </div>
                  </div>
                ))}
             </div>
          </section>

          <section className="lg:col-span-8 glass-panel p-10 rounded-[2.5rem] border-white/10 flex flex-col bg-black/20">
             <div className="flex flex-col sm:flex-row items-center justify-between mb-10 border-b border-white/5 pb-8 gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-[#34E0F7]/10 rounded-2xl border border-[#34E0F7]/20">
                    <ImageIcon size={24} className="text-[#34E0F7] glow-cyan" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-[13px] uppercase tracking-[0.4em] font-black text-white">BIBLIOTEKA ZDJĘĆ MARKI</h3>
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Zasoby wizualne dla AI Engine ({brand.assets?.length || 0} / 10)</p>
                  </div>
                </div>
                {(brand.assets?.length || 0) < 10 && (
                   <label className="flex items-center gap-3 px-8 py-3.5 bg-[#34E0F7] text-black rounded-xl text-[11px] font-orbitron uppercase tracking-widest cursor-pointer hover:bg-white transition-all font-black shadow-[0_0_20px_rgba(52,224,247,0.3)]">
                      <Plus size={18}/> DODAJ ASSET
                      <input type="file" className="hidden" onChange={handleAssetUpload} />
                   </label>
                )}
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                {(brand.assets || []).map((asset) => (
                  <div key={asset.id} className="flex flex-col gap-3 group">
                     <div className="aspect-square rounded-2xl border border-white/5 overflow-hidden relative shadow-2xl bg-black">
                        <img src={asset.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Asset" />
                        <button onClick={() => removeBrandAsset(asset.id)} className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                     </div>
                     <select value={asset.tag} onChange={(e) => updateBrandAssetTag(asset.id, e.target.value as any)} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[9px] font-orbitron text-white/60 outline-none uppercase tracking-widest focus:border-[#34E0F7] cursor-pointer">
                        <option value="PRODUKT">PRODUKT</option>
                        <option value="LUDZIE">LUDZIE</option>
                        <option value="WNĘTRZE">WNĘTRZE</option>
                        <option value="MOOD/DETAL">MOOD</option>
                     </select>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* VOICE ARCHITECT & YODA MODE */}
        <section className="glass-panel p-12 rounded-[3rem] border-white/10 flex flex-col space-y-12 bg-black/20 shadow-2xl">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-8">
             <div className="flex items-center gap-5">
               <div className="p-4 bg-[#C74CFF]/10 rounded-2xl border border-[#C74CFF]/20">
                  <Mic2 size={24} className="text-[#C74CFF] glow-magenta" />
               </div>
               <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">Profil Głosu (Voice Architect)</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Definicja tonacji i stylu komunikacji</p>
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
                   <div className={`p-4 rounded-full transition-all duration-500 ${brand.voiceProfile === v.id ? 'bg-[#C74CFF] text-white' : 'bg-white/5 text-white/20 group-hover:bg-white/10'}`}>
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

        {/* DNA INTEL */}
        <section className="glass-panel rounded-[3rem] border-white/10 overflow-hidden flex flex-col bg-black/40 border-l-4 border-l-[#34E0F7] shadow-2xl">
          <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <div className="flex items-center gap-5">
                <div className="p-4 bg-[#34E0F7]/10 rounded-2xl border border-[#34E0F7]/20">
                  <Dna size={24} className="text-[#34E0F7] glow-cyan" />
                </div>
                <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">DNA INTEL: SZCZEGÓŁY KONSTRUKCJI</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Parametry tekstowe i pozycjonowanie</p>
                </div>
             </div>
          </div>

          <div className="p-10 space-y-12">
             <div className="space-y-6">
                <label className="text-[11px] font-orbitron text-[#34E0F7] uppercase tracking-widest flex items-center gap-3 font-black">
                  <Globe size={16} /> JĘZYK GENEROWANIA TREŚCI (MISSION_LANGUAGE)
                </label>
                <div className="flex flex-wrap gap-4">
                  {languages.map((lang) => (
                    <button key={lang} onClick={() => updateBrand({ missionLanguage: lang })} className={`flex-1 min-w-[120px] py-4 rounded-2xl border-2 transition-all font-orbitron font-black text-xs tracking-widest ${brand.missionLanguage === lang ? 'border-[#34E0F7] bg-[#34E0F7]/10 text-[#34E0F7] shadow-[0_0_20px_rgba(52,224,247,0.2)]' : 'border-white/5 text-white/20 hover:border-white/10'}`}>
                      {lang === 'PL' ? 'POLSKI' : lang === 'EN' ? 'ENGLISH' : lang === 'NO' ? 'NORSK' : 'RUSSIAN'}
                    </button>
                  ))}
                </div>
             </div>

             <div className="space-y-4 max-w-3xl">
                <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-3 font-black">
                  <FileText size={16} className="text-[#34E0F7]"/> Pełny Opis Marki (Brand Bio)
                </label>
                <textarea 
                  value={brand.description}
                  onChange={(e) => updateBrand({ description: e.target.value })}
                  placeholder="Opis wyekstrahowany ze skanu strony lub wpisany ręcznie..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[13px] font-inter focus:border-[#34E0F7] outline-none transition-all shadow-inner text-white/80 min-h-[140px] resize-none"
                />
             </div>

             <div className="space-y-4 max-w-3xl">
                <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-3 font-black">
                  <Target size={16} className="text-[#34E0F7]"/> Marka w jednym zdaniu (Core Mission)
                </label>
                <input type="text" value={brand.coreMission} onChange={(e) => updateBrand({ coreMission: e.target.value })} placeholder="Główny cel Twojej marki..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[13px] font-inter focus:border-[#34E0F7] outline-none transition-all shadow-inner text-white/80" />
             </div>

             <div className="space-y-4">
                <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-3 font-black">
                  <Hexagon size={16} className="text-[#34E0F7]"/> 3 Filary Marki
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(brand.pillars || ['', '', '']).map((p, i) => (
                    <div key={i} className="relative">
                      <input type="text" value={p} onChange={(e) => {
                          const newPillars = [...(brand.pillars || ['', '', ''])];
                          newPillars[i] = e.target.value;
                          updateBrand({ pillars: newPillars });
                        }} placeholder={`Filar 0${i+1}`} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all shadow-inner text-white/80 pl-12" />
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-orbitron text-[#34E0F7]/40 font-black">0{i+1}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="p-10 border-t border-white/5 bg-black/80 flex items-center justify-between">
             <div className="flex items-center gap-4 text-white/20 text-[10px] font-mono uppercase tracking-[0.3em] font-black">
                <Rocket size={18} className="animate-pulse" /> NEURAL_DNA_SYNC_READY
             </div>
             <NeonButton variant="cyan" className="py-6 px-16 text-sm font-black shadow-[0_0_50px_rgba(52,224,247,0.3)] flex items-center gap-4 border-2" onClick={handleSyncDNA} disabled={isSyncing}>
                {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />} ZAPISZ I SYNCHRONIZUJ DNA
             </NeonButton>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, scale: 0.8 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 p-6 rounded-[1.5rem] glass-panel flex items-center gap-4 z-[200] border border-[#34E0F7]/50 shadow-[0_0_40px_rgba(52,224,247,0.2)] bg-black/90">
            <div className="w-10 h-10 rounded-full bg-[#34E0F7]/20 flex items-center justify-center text-[#34E0F7]">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="font-orbitron text-sm uppercase tracking-widest text-[#34E0F7] font-black">KOORDYNATY MARKI ZAPISANE</p>
               <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">DNA Marki zostało zsynchronizowane.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandKit;
