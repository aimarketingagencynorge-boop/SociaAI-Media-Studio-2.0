
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
  AlertCircle
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import NeonButton from './NeonButton';
import { BrandAsset } from '../types';

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
    
    // 1. Logos (Max 25%)
    if (brand.logos?.main) score += 15;
    if (brand.logos?.light) score += 5;
    if (brand.logos?.dark) score += 5;
    
    // 2. Assets (Max 30% - 3% per asset)
    const assetScore = (brand.assets?.length || 0) * 3;
    score += Math.min(assetScore, 30);
    
    // 3. Voice & Mission (Max 45%)
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
    // Symulacja archiwizacji DNA w chmurze AI
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
        
        {/* KOKPIT 1: HUD HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 glass-panel p-10 rounded-[2rem] border-white/10 relative overflow-hidden bg-black/40 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#34E0F7]/5 via-transparent to-[#8C4DFF]/5 pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-4 text-[10px] font-mono text-[#34E0F7] uppercase tracking-[0.5em] font-black mb-1">
               <ShieldCheck size={14} /> DNA_SYNC: {isSyncing ? 'SYNCHRONIZING...' : 'OPERATIONAL'} | STORAGE: ENCRYPTED
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

             <NeonButton 
               variant="purple" 
               className={`px-10 py-5 flex items-center gap-4 text-sm font-black tracking-[0.1em] border-2 shadow-[0_0_30px_rgba(140,77,255,0.2)] ${isSyncing ? 'opacity-50' : ''}`}
               onClick={handleSyncDNA}
               disabled={isSyncing}
             >
                {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} className="fill-current" />}
                {isSyncing ? 'SYNCHRONIZACJA...' : 'SYNCHRONIZUJ DNA MARKI'}
             </NeonButton>
          </div>
        </header>

        {/* SEKCJA 1: LOGO VAULT & VISUAL ASSETS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Logo Vault (Left Side) */}
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
                    <div className="mt-2 text-[8px] font-mono text-white/20 uppercase tracking-widest px-1">{l.desc}</div>
                  </div>
                ))}
             </div>
          </section>

          {/* Visual Library (Right Side) */}
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
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded border border-[#34E0F7]/40 text-[7px] font-orbitron text-[#34E0F7] uppercase tracking-widest font-black">[✓ SYNC]</div>
                        <button onClick={() => removeBrandAsset(asset.id)} className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                     </div>
                     <select 
                       value={asset.tag}
                       onChange={(e) => updateBrandAssetTag(asset.id, e.target.value as any)}
                       className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[9px] font-orbitron text-white/60 outline-none uppercase tracking-widest focus:border-[#34E0F7] cursor-pointer"
                     >
                        <option value="PRODUKT">PRODUKT</option>
                        <option value="LUDZIE">LUDZIE</option>
                        <option value="WNĘTRZE">WNĘTRZE</option>
                        <option value="MOOD/DETAL">MOOD</option>
                     </select>
                  </div>
                ))}
                {[...Array(Math.max(0, 10 - (brand.assets?.length || 0)))].map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center opacity-10 hover:opacity-30 hover:border-[#34E0F7]/40 transition-all cursor-pointer relative group">
                     <Plus size={32} className="group-hover:scale-110 transition-transform" />
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAssetUpload} />
                  </div>
                ))}
             </div>
             <p className="mt-10 p-6 bg-[#34E0F7]/5 rounded-2xl border border-[#34E0F7]/10 text-[10px] font-orbitron text-[#34E0F7]/60 uppercase tracking-[0.2em] italic leading-relaxed">
               * WAŻNE: Wgrane asety zostaną wykorzystane jako referencje stylistyczne dla silników Google Veo i Gemini Flash Image, zapewniając spójność wizualną każdej generowanej treści.
             </p>
          </section>
        </div>

        {/* SEKCJA 2: ARCHITEKT GŁOSU (VOICE ARCHITECT) */}
        <section className="glass-panel p-12 rounded-[3rem] border-white/10 flex flex-col space-y-12 bg-black/20 shadow-2xl">
           <div className="flex items-center gap-5 border-b border-white/5 pb-8">
             <div className="p-4 bg-[#C74CFF]/10 rounded-2xl border border-[#C74CFF]/20">
                <Mic2 size={24} className="text-[#C74CFF] glow-magenta" />
             </div>
             <div>
                <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">Profil Głosu (Voice Architect)</h3>
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Definicja tonacji i sposobu komunikacji werbalnej</p>
             </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {voiceProfiles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => updateBrand({ voiceProfile: v.id as any })}
                  className={`group relative p-8 rounded-[2rem] border transition-all duration-700 overflow-hidden flex flex-col items-center text-center gap-5 ${brand.voiceProfile === v.id ? 'border-[#C74CFF] bg-[#C74CFF]/10 text-white shadow-[0_0_40px_rgba(199,76,255,0.15)]' : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/20'}`}
                >
                   <div className={`p-4 rounded-full transition-all duration-500 ${brand.voiceProfile === v.id ? 'bg-[#C74CFF] text-white' : 'bg-white/5 text-white/20 group-hover:bg-white/10'}`}>
                      {v.icon}
                   </div>
                   <div className="space-y-2">
                      <div className="text-[11px] font-orbitron uppercase tracking-[0.2em] font-black">{v.label}</div>
                      <div className="text-[9px] font-inter opacity-60 leading-tight">{v.desc}</div>
                   </div>
                   {brand.voiceProfile === v.id && (
                     <motion.div layoutId="profile-glow" className="absolute -bottom-1 w-full h-1 bg-[#C74CFF] blur-md shadow-[0_0_20px_#C74CFF]" />
                   )}
                </button>
              ))}
           </div>

           <div className="space-y-5">
              <div className="flex items-center gap-3 text-[11px] font-orbitron text-[#C74CFF] uppercase tracking-[0.3em] font-black">
                 <Users size={16} /> Relacja z ludźmi (Human Touch Protocol)
              </div>
              <textarea 
                value={brand.humanTouch}
                onChange={(e) => updateBrand({ humanTouch: e.target.value })}
                placeholder="Np: Zespół traktujemy jak rodzinę, gości jak przyjaciół domu. Piszemy ciepło, ale profesjonalnie, unikając sztywnego korpomówienia."
                className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] p-8 text-[13px] leading-relaxed text-white/80 outline-none focus:border-[#C74CFF] transition-all min-h-[160px] font-inter shadow-inner custom-scrollbar"
              />
           </div>
        </section>

        {/* SEKCJA 3: DNA INTEL (SCROLLABLE DETAILS) */}
        <section className="glass-panel rounded-[3rem] border-white/10 overflow-hidden flex flex-col bg-black/40 border-l-4 border-l-[#34E0F7] shadow-2xl">
          <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <div className="flex items-center gap-5">
                <div className="p-4 bg-[#34E0F7]/10 rounded-2xl border border-[#34E0F7]/20">
                  <Dna size={24} className="text-[#34E0F7] glow-cyan" />
                </div>
                <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">DNA INTEL: SZCZEGÓŁY KONSTRUKCJI</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Parametry tekstowe i pozycjonowanie marki</p>
                </div>
             </div>
             <div className="flex items-center gap-3 px-4 py-2 bg-[#34E0F7]/10 rounded-full border border-[#34E0F7]/20">
                <span className="animate-pulse w-2 h-2 rounded-full bg-[#34E0F7] glow-cyan" />
                <span className="text-[9px] font-mono text-[#34E0F7] font-black tracking-widest">REAL_TIME_SYNC: ON</span>
             </div>
          </div>

          <div className="p-10 space-y-12">
             
             {/* Core Mission */}
             <div className="space-y-4 max-w-3xl">
                <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-3 font-black">
                  <Target size={16} className="text-[#34E0F7]"/> Marka w jednym zdaniu (Core Mission)
                </label>
                <input 
                  type="text" 
                  value={brand.coreMission}
                  onChange={(e) => updateBrand({ coreMission: e.target.value })}
                  placeholder="Np. Serwujemy emocje ukryte w smaku rzemieślniczego sushi klasy premium."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[13px] font-inter focus:border-[#34E0F7] outline-none transition-all shadow-inner text-white/80"
                />
             </div>

             {/* Filary Marki */}
             <div className="space-y-4">
                <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-3 font-black">
                  <Hexagon size={16} className="text-[#34E0F7]"/> 3 Filary Marki (Główne Wartości)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(brand.pillars || ['', '', '']).map((p, i) => (
                    <div key={i} className="relative">
                      <input 
                        type="text" 
                        value={p}
                        onChange={(e) => {
                          const newPillars = [...(brand.pillars || ['', '', ''])];
                          newPillars[i] = e.target.value;
                          updateBrand({ pillars: newPillars });
                        }}
                        placeholder={`Filar 0${i+1}`}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all shadow-inner text-white/80 pl-12"
                      />
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-orbitron text-[#34E0F7]/40 font-black">0{i+1}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* Słownik Marki */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-orbitron text-[#34E0F7] uppercase tracking-widest flex items-center gap-3 font-black">Słowa kluczowe (Używaj często)</label>
                  <textarea 
                    value={brand.dictionary?.keywords?.join(', ') || ''}
                    onChange={(e) => updateBrand({ dictionary: { ...brand.dictionary, keywords: e.target.value.split(',').map(s => s.trim()) } })}
                    placeholder="świeżość, pasja, rzemiosło, tradycja, jakość..."
                    className="w-full bg-white/5 border border-[#34E0F7]/20 rounded-2xl p-6 text-[12px] font-mono focus:border-[#34E0F7] outline-none min-h-[140px] text-white/70 shadow-inner custom-scrollbar"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-orbitron text-red-500/60 uppercase tracking-widest flex items-center gap-3 font-black">Słowa zakazane (Unikaj kategorycznie)</label>
                  <textarea 
                    value={brand.dictionary?.forbidden?.join(', ') || ''}
                    onChange={(e) => updateBrand({ dictionary: { ...brand.dictionary, forbidden: e.target.value.split(',').map(s => s.trim()) } })}
                    placeholder="tanio, szybko, byle jak, standardowo..."
                    className="w-full bg-white/5 border border-red-500/20 rounded-2xl p-6 text-[12px] font-mono focus:border-red-500 outline-none min-h-[140px] text-white/70 shadow-inner custom-scrollbar"
                  />
                </div>
             </div>

             {/* Emoji & CTA Styles */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-[11px] font-orbitron text-white/40 uppercase tracking-widest font-black">
                    <span>Ekspresja Emoji</span>
                    <span className="text-[#34E0F7]">{brand.emojiStyle < 33 ? 'MINIMAL' : brand.emojiStyle < 66 ? 'ZBALANSOWANY' : 'EKSPRESYJNY'}</span>
                  </div>
                  <div className="relative pt-2">
                    <input 
                      type="range" min="0" max="100" 
                      value={brand.emojiStyle || 50}
                      onChange={(e) => updateBrand({ emojiStyle: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-[#34E0F7] cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-[8px] font-mono text-white/10">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest font-black">Styl CTA (Wezwanie do działania)</label>
                  <div className="flex gap-4">
                    {['delicate', 'educational', 'direct'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateBrand({ ctaStyle: s as any })}
                        className={`flex-1 py-4 rounded-xl text-[10px] font-orbitron uppercase tracking-widest border transition-all font-black ${brand.ctaStyle === s ? 'border-[#34E0F7] bg-[#34E0F7]/10 text-[#34E0F7] shadow-[0_0_15px_rgba(52,224,247,0.1)]' : 'border-white/5 text-white/20 hover:border-white/10 hover:text-white/40'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
             </div>

             {/* Mission Context */}
             <div className="space-y-5 max-w-md">
                <label className="text-[11px] font-orbitron text-[#34E0F7] uppercase tracking-widest font-black">DOMYŚLNY KONTEKST KOMUNIKACJI</label>
                <div className="relative">
                  <select 
                    value={brand.missionContext}
                    onChange={(e) => updateBrand({ missionContext: e.target.value as any })}
                    className="w-full bg-black/60 border border-[#34E0F7]/40 rounded-2xl p-5 text-[11px] font-orbitron uppercase text-[#34E0F7] outline-none cursor-pointer hover:bg-[#34E0F7]/10 transition-colors appearance-none font-black"
                  >
                    <option value="ig">Post / Reels (Instagram)</option>
                    <option value="fb">Aktualność / News (Facebook)</option>
                    <option value="li">Profesjonalny / Thought Leader (LinkedIn)</option>
                    <option value="ad">Sprzedażowy / Conversion Ad</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#34E0F7]/40">
                     <Plus size={14} className="rotate-45" />
                  </div>
                </div>
             </div>
          </div>

          {/* Section Footer / Save Button */}
          <div className="p-10 border-t border-white/5 bg-black/80 flex items-center justify-between">
             <div className="flex items-center gap-4 text-white/20 text-[10px] font-mono uppercase tracking-[0.3em] font-black">
                <Rocket size={18} className="animate-pulse" /> NEURAL_DNA_SYNC_READY_FOR_GALAXY
             </div>
             <NeonButton 
              variant="cyan" 
              className="py-6 px-16 text-sm font-black shadow-[0_0_50px_rgba(52,224,247,0.3)] flex items-center gap-4 border-2"
              onClick={handleSyncDNA}
              disabled={isSyncing}
             >
                {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />} 
                ZAPISZ I SYNCHRONIZUJ DNA
             </NeonButton>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-20 py-24 text-center border-t border-white/5 space-y-4">
          <p className="text-white/10 text-[10px] font-mono tracking-[0.5em] uppercase font-black">
            SociAI MediA Studio | {t.footer} | <span className="text-[#34E0F7]/40">{t.slogan}</span>
          </p>
          <div className="flex justify-center gap-6 opacity-5">
             <ShieldCheck size={20} />
             <RefreshCw size={20} />
             <Zap size={20} />
          </div>
        </footer>
      </div>

      {/* SYNC TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 p-6 rounded-[1.5rem] glass-panel flex items-center gap-4 z-[200] border border-[#34E0F7]/50 shadow-[0_0_40px_rgba(52,224,247,0.2)] bg-black/90"
          >
            <div className="w-10 h-10 rounded-full bg-[#34E0F7]/20 flex items-center justify-center text-[#34E0F7]">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="font-orbitron text-sm uppercase tracking-widest text-[#34E0F7] font-black">KOORDYNATY MARKI ZAPISANE</p>
               <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Silnik AI został poprawnie skalibrowany.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandKit;
