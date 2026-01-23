
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Briefcase, 
  Zap, 
  User, 
  Share2, 
  Loader2, 
  ChevronRight, 
  Terminal, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Palette,
  Mic2,
  Rocket,
  Plus,
  Trash2,
  ChevronLeft,
  X,
  Instagram,
  Facebook,
  Linkedin,
  CloudUpload,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';
import AutopilotOverlay from './AutopilotOverlay';

const Onboarding: React.FC = () => {
  const { 
    language, 
    onboardingStep, 
    setOnboardingStep, 
    brand, 
    updateBrand, 
    setAutopilotRunning, 
    setWeeklyPlan, 
    resetMission,
    socialLinks,
    toggleSocialLink
  } = useStore();
  
  const t = translations[language];
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> [SYSTEM]: ${msg}`]);
  };

  const handleScan = async () => {
    if (!url) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setLogs([]);
    setScanComplete(false);
    
    addLog(`Initiating portal scan in language: ${language}...`);
    
    const scanMessages = [
      "Deploying scanning drones...",
      "Analyzing CSS and DOM structure...",
      "Extracting Meta-DNA...",
      "Decoding visual signature..."
    ];
    
    for (let i = 0; i < scanMessages.length; i++) {
      addLog(scanMessages[i]);
      setScanProgress((prev) => Math.min(prev + 25, 90));
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const data = await gemini.scanWebsite(url, language);
      setScanProgress(100);
      addLog(`DNA Map extracted successfully in ${language}.`);
      addLog(`Brand detected: ${data.name}`);
      
      updateBrand({
        name: data.name,
        description: data.description,
        industry: data.industry,
        colors: data.colors,
        toneOfVoice: data.toneOfVoice,
        toneConfidence: data.toneConfidence,
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        ctaLink: url
      });
      
      setScanComplete(true);
    } catch (e) {
      addLog("CRITICAL_ERR: SCAN_BUFFER_OVERFLOW.");
    } finally {
      setIsScanning(false);
    }
  };

  const finalizeMission = async () => {
    if (!brand.logoUrl) {
      alert("LOGO_REQUIRED: Proszę wgrać lub zatwierdzić logo przed odpaleniem silników.");
      setOnboardingStep(3);
      return;
    }
    setAutopilotRunning(true);
    try {
      const plan = await gemini.generateWeeklyPlan(brand, language);
      // setWeeklyPlan might throw if persistence fails, but with IndexedDB it's much safer
      setWeeklyPlan(plan);
      setOnboardingStep(0); 
    } catch (e: any) {
      console.error("Autopilot failed", e);
      alert(`Autopilot Error: ${e.message || "Failed to generate or save mission plan. Check your internet connection or storage quota."}`);
    } finally {
      setAutopilotRunning(false);
    }
  };

  const steps = [
    { icon: <Globe />, label: "SCAN" },
    { icon: <Briefcase />, label: "DNA" },
    { icon: <Palette />, label: "LOOK" },
    { icon: <Mic2 />, label: "VOICE" },
    { icon: <Share2 />, label: "SYNC" },
  ];

  const handleStepBack = () => {
    if (onboardingStep > 1) setOnboardingStep(onboardingStep - 1);
  };

  const handleStepNext = () => {
    if (onboardingStep === 3 && !brand.logoUrl) return;
    if (onboardingStep < 5) setOnboardingStep(onboardingStep + 1);
    else finalizeMission();
  };

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white p-6 md:p-12 flex flex-col items-center overflow-y-auto relative pb-32">
      <AutopilotOverlay />

      <div className="w-full max-w-4xl mb-12 relative flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="absolute top-1/2 left-8 right-8 h-[1px] bg-white/5 -translate-y-1/2" />
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = onboardingStep === stepNum;
          const isCompleted = onboardingStep > stepNum;
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div 
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  borderColor: isActive ? '#34E0F7' : isCompleted ? '#8C4DFF' : 'rgba(255,255,255,0.1)'
                }}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2
                ${isActive ? 'bg-[#34E0F7] text-black shadow-[0_0_20px_rgba(52,224,247,0.4)]' : isCompleted ? 'bg-[#8C4DFF] text-white' : 'bg-[#0A0A12] text-white/40'}
                `}
              >
                {step.icon}
              </motion.div>
              <span className={`text-[8px] font-orbitron uppercase tracking-widest ${isActive ? 'text-[#34E0F7]' : 'text-white/20'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-4xl z-10">
        <AnimatePresence mode="wait">
          {onboardingStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="glass-panel p-6 md:p-10 rounded-3xl relative overflow-hidden border-cyan-500/20">
                <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black font-orbitron mb-2 text-white">1. {t.onboarding.step1}</h2>
                    <p className="text-white/40 text-sm font-orbitron tracking-wide uppercase">{t.onboarding.step1Desc}</p>
                  </div>
                  {scanComplete && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-3 px-4 py-2 bg-[#34E0F7]/10 text-[#34E0F7] border border-[#34E0F7]/40 rounded-full text-[10px] font-orbitron tracking-widest">
                      <CheckCircle2 size={14} /> SCAN_OK (98%)
                    </motion.div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div className="relative">
                    <input type="text" placeholder={t.onboarding.scanPlaceholder} value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-5 outline-none focus:border-[#34E0F7] focus:ring-4 focus:ring-[#34E0F7]/10 transition-all font-mono text-sm tracking-wider" />
                  </div>
                  <NeonButton variant="cyan" className="w-full py-5 flex items-center justify-center gap-4 group text-lg" onClick={handleScan} disabled={isScanning}>
                    {isScanning ? <Loader2 className="animate-spin" /> : <Globe size={22} className="group-hover:rotate-12 transition-transform" />}
                    <span className="font-black">SCAN UNIVERSE</span>
                  </NeonButton>
                </div>

                {(isScanning || logs.length > 0) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-10 bg-black/60 border border-white/10 rounded-2xl p-6 font-mono text-xs overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 text-white/40 font-orbitron text-[10px] uppercase tracking-widest">
                      <Terminal size={14} /> _SHIP_STATUS: NEURAL_SCAN_FEED
                    </div>
                    <div ref={consoleRef} className="max-h-40 overflow-y-auto scrollbar-hide space-y-2">
                      {logs.map((log, i) => (
                        <div key={i} className={i === logs.length - 1 ? "text-[#34E0F7] animate-pulse" : "text-white/30"}>{log}</div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {scanComplete && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center relative">
                   <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#34E0F7] rounded-full nav-beacon hidden md:block" />
                   <NeonButton variant="cyan" className="w-full py-6 text-xl font-black shadow-[0_0_50px_rgba(52,224,247,0.3)] flex items-center justify-center gap-4 group" onClick={handleStepNext}>
                     {t.onboarding.next} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                   </NeonButton>
                </motion.div>
              )}
            </motion.div>
          )}

          {onboardingStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="space-y-8">
              <div className="glass-panel p-6 md:p-10 rounded-3xl border-[#8C4DFF]/20">
                <h2 className="text-3xl font-black font-orbitron mb-8 text-white uppercase tracking-widest">2. DNA MARKI</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Nazwa Marki</label>
                    <input type="text" value={brand.name} onChange={e => updateBrand({ name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#8C4DFF]" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Branża</label>
                    <input type="text" value={brand.industry} onChange={e => updateBrand({ industry: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#8C4DFF]" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Misja / Opis (${language})</label>
                    <textarea value={brand.description} onChange={e => updateBrand({ description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#8C4DFF] min-h-[100px]" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">USP (Unikalna Cecha)</label>
                    <input type="text" placeholder="..." value={brand.usp || ''} onChange={e => updateBrand({ usp: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#8C4DFF]" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={handleStepBack} className="p-4 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"><ChevronLeft /></button>
                 <NeonButton variant="purple" className="flex-1 py-5 font-black" onClick={handleStepNext}>NASTĘPNY ETAP: LOOK</NeonButton>
              </div>
            </motion.div>
          )}

          {onboardingStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="space-y-8">
              <div className="glass-panel p-6 md:p-10 rounded-3xl border-[#C74CFF]/20">
                <h2 className="text-3xl font-black font-orbitron mb-10 text-white uppercase tracking-widest">3. TOŻSAMOŚĆ WIZUALNA</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Logo Marki (Wymagane)</label>
                      <div className="aspect-square glass-panel border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group hover:border-[#34E0F7]/40 transition-all">
                        {brand.logoUrl ? (
                          <>
                            <motion.img 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              src={brand.logoUrl} 
                              alt="Brand Logo" 
                              className="max-w-[80%] max-h-[80%] object-contain relative z-10 glow-cyan" 
                              onError={() => updateBrand({ logoUrl: '' })}
                            />
                            <button onClick={() => updateBrand({ logoUrl: '' })} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white/40 hover:text-red-500 z-20"><X size={16} /></button>
                          </>
                        ) : (
                          <div className="space-y-4 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[#34E0F7] animate-pulse"><CloudUpload size={32} /></div>
                            <p className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Wgraj Logo Marki</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => updateBrand({ logoUrl: reader.result as string });
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </div>
                        )}
                      </div>
                      {!brand.logoUrl && (
                        <div className="flex items-center gap-2 text-red-500/60 text-[10px] font-orbitron uppercase animate-pulse">
                           <AlertCircle size={12} /> Proszę wgrać logo przed kontynuacją
                        </div>
                      )}
                   </div>
                   <div className="space-y-6">
                      <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Paleta Kolorów</label>
                      <div className="space-y-4">
                        {brand.colors.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 glass-panel border-white/10 rounded-2xl group">
                            <input type="color" value={color.hex} onChange={e => {
                                const newColors = [...brand.colors];
                                newColors[idx].hex = e.target.value;
                                updateBrand({ colors: newColors });
                            }} className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg" />
                            <div className="flex-1">
                                <input type="text" value={color.name} onChange={e => {
                                    const newColors = [...brand.colors];
                                    newColors[idx].name = e.target.value;
                                    updateBrand({ colors: newColors });
                                }} className="bg-transparent border-none text-[10px] font-orbitron uppercase tracking-widest outline-none text-white/80 w-full" />
                                <p className="text-[10px] font-mono text-white/20">{color.hex}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={handleStepBack} className="p-4 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"><ChevronLeft /></button>
                 <div className="relative flex-1 group">
                    {brand.logoUrl && <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#34E0F7] rounded-full nav-beacon hidden md:block" />}
                    <NeonButton variant="magenta" className="w-full py-5 font-black" onClick={handleStepNext} disabled={!brand.logoUrl}>NASTĘPNY ETAP: VOICE</NeonButton>
                 </div>
              </div>
            </motion.div>
          )}

          {onboardingStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="space-y-8">
              <div className="glass-panel p-6 md:p-10 rounded-3xl border-cyan-500/20">
                <h2 className="text-3xl font-black font-orbitron mb-8 text-white uppercase tracking-widest">4. GŁOS MARKI</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {['Professional', 'Energetic', 'Casual', 'Minimalist'].map(tone => (
                    <button key={tone} onClick={() => updateBrand({ toneOfVoice: tone.toLowerCase() })} className={`p-4 rounded-2xl border transition-all text-[10px] font-orbitron uppercase tracking-widest ${brand.toneOfVoice === tone.toLowerCase() ? 'border-[#34E0F7] bg-[#34E0F7]/10 text-[#34E0F7]' : 'border-white/5 text-white/30 hover:bg-white/5'}`}>
                      {tone}
                    </button>
                  ))}
                </div>
                <div onClick={() => updateBrand({ isYodaMode: !brand.isYodaMode })} className={`p-8 rounded-3xl border-2 flex items-center justify-between cursor-pointer transition-all ${brand.isYodaMode ? 'border-[#8C4DFF] bg-[#8C4DFF]/5' : 'border-white/5 hover:border-white/10'}`}>
                  <div className="flex items-center gap-6">
                     <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${brand.isYodaMode ? 'bg-[#8C4DFF] text-white' : 'bg-white/5 text-white/20'}`}><Sparkles size={32} /></div>
                     <div>
                        <h3 className={`text-xl font-black font-orbitron tracking-tight ${brand.isYodaMode ? 'text-[#8C4DFF]' : 'text-white'}`}>YODA MODE (PL)</h3>
                        <p className="text-white/40 text-[10px] font-orbitron uppercase tracking-widest">Polska składnia przestawna (Np: Sushi zjeść musisz)</p>
                     </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative ${brand.isYodaMode ? 'bg-[#8C4DFF]' : 'bg-white/10'}`}>
                     <motion.div animate={{ x: brand.isYodaMode ? 24 : 4 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={handleStepBack} className="p-4 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"><ChevronLeft /></button>
                 <NeonButton variant="cyan" className="flex-1 py-5 font-black" onClick={handleStepNext}>NASTĘPNY ETAP: SYNC</NeonButton>
              </div>
            </motion.div>
          )}

          {onboardingStep === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="space-y-8">
              <div className="glass-panel p-6 md:p-10 rounded-3xl border-white/5">
                <h2 className="text-3xl font-black font-orbitron mb-4 text-white uppercase tracking-widest">5. WĘZŁY KOMUNIKACYJNE</h2>
                <p className="text-white/40 text-[10px] font-orbitron mb-10 uppercase tracking-widest">Synchronizacja Satelitarna Kont Społecznościowych</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[{ id: 'instagram', icon: <Instagram />, label: 'Instagram' }, { id: 'facebook', icon: <Facebook />, label: 'Facebook' }, { id: 'linkedin', icon: <Linkedin />, label: 'LinkedIn' }, { id: 'tiktok', icon: <Rocket />, label: 'TikTok' }].map(p => {
                    const active = socialLinks[p.id];
                    return (
                      <div key={p.id} onClick={() => toggleSocialLink(p.id)} className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${active ? 'border-[#34E0F7] bg-[#34E0F7]/5' : 'border-white/5 hover:border-white/10'}`}>
                         <div className="flex items-center gap-4">
                            <div className={active ? 'text-[#34E0F7]' : 'text-white/20'}>{p.icon}</div>
                            <span className={`text-xs font-orbitron uppercase tracking-widest ${active ? 'text-white' : 'text-white/20'}`}>{p.label}</span>
                         </div>
                         <div className={`text-[8px] font-orbitron px-2 py-1 rounded ${active ? 'bg-[#34E0F7]/20 text-[#34E0F7]' : 'bg-white/5 text-white/10'}`}>{active ? 'LINK_ACTIVE' : 'OFFLINE'}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={handleStepBack} className="p-4 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"><ChevronLeft /></button>
                 <NeonButton variant="cyan" className="flex-1 py-6 font-black text-xl shadow-[0_0_50px_rgba(52,224,247,0.4)] flex items-center justify-center gap-4" onClick={finalizeMission}>ODPAL MISJĘ <Rocket size={24} /></NeonButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <footer className="mt-auto py-12 text-white/10 text-[9px] font-mono tracking-[0.5em] uppercase text-center w-full">
        SociAI MediA Studio | {t.footer} | <span className="text-[#34E0F7]/40 uppercase">{t.slogan}</span>
      </footer>
    </div>
  );
};

export default Onboarding;
