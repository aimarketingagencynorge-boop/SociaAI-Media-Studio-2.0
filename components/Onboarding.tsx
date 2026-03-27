
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Briefcase, 
  Zap, 
  Share2, 
  ChevronLeft, 
  X, 
  CloudUpload, 
  ImageIcon, 
  Mic2, 
  Palette, 
  Rocket, 
  Instagram, 
  Facebook, 
  Linkedin, 
  AlertCircle,
  ShieldCheck,
  Key,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';
import AutopilotOverlay from './AutopilotOverlay';

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

const Onboarding: React.FC = () => {
  const { 
    language, 
    onboardingStep, 
    setOnboardingStep, 
    brand, 
    updateBrand, 
    setAutopilotRunning, 
    setWeeklyPlan, 
    socialLinks,
    toggleSocialLink,
    credits,
    aiSettings,
    isLoadingAICredits,
    workspaceId,
    userId
  } = useStore();
  
  const t = translations[language];
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type?: 'system' | 'error' | 'source' | 'warn'}[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string, type: 'system' | 'error' | 'source' | 'warn' = 'system') => {
    setLogs(prev => [...prev, { msg: `> [${type.toUpperCase()}]: ${msg}`, type }]);
  };

  const handleScan = async () => {
    if (!url) return;
    
    const hasCredits = aiSettings ? (aiSettings.creditBalance > 0) : (credits > 0);
    const isInitializing = isLoadingAICredits || (!aiSettings && workspaceId);

    if (isInitializing) {
      addLog("Initializing Neural Link... Please wait.", "system");
      return;
    }

    if (!hasCredits) {
      setIsRepairing(true);
      addLog("REPAIRING_NEURAL_LINK: Attempting to restore energy units...", "warn");
      try {
        const response = await fetch('/api/auth/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email: brand.email })
        });
        const data = await response.json();
        if (data.credits > 0) {
          addLog("ENERGY_RESTORED: 500 units synchronized. Retrying scan...", "system");
          setIsRepairing(false);
          // The store will update via AuthContext snapshots, but we can wait a bit
          setTimeout(() => handleScan(), 1000);
          return;
        } else {
          addLog("REPAIR_FAILED: Could not restore energy. Please check Settings.", "error");
        }
      } catch (err) {
        console.error("Repair failed:", err);
        addLog("REPAIR_FAILED: Portal unreachable.", "error");
      }
      setIsRepairing(false);
      return;
    }

    setIsScanning(true);
    setLogs([]);
    setScanComplete(false);
    
    addLog(`Targeting portal: ${url}`);
    addLog(`Authenticating satellite session...`);
    
    try {
      addLog("Engagement: Global Neural Indexing...");
      const result = await gemini.scanWebsite(url, brand.contentLanguage);
      const { data, sources } = result;
      
      addLog(`DNA Map verified. Confidence Level: ${(data.toneConfidence * 100).toFixed(1)}%`);
      addLog(`Entity Detected: ${data.name}`);
      
      if (sources && sources.length > 0) {
        addLog(`Verified Knowledge Sources:`);
        sources.forEach((src: string) => addLog(src, "source"));
      }
      
      updateBrand({
        name: data.name || 'New Brand',
        description: data.description || '',
        industry: data.industry || '',
        colors: data.colors || brand.colors,
        toneOfVoice: data.toneOfVoice || '',
        toneConfidence: data.toneConfidence || 0,
        ctaLink: url
      });
      
      setScanComplete(true);
      addLog(`DNA SYNCHRONIZED. Mission architecture is ready for deployment.`);
    } catch (e: any) {
      const errorMsg = e.message || 'PORTAL_UNREACHABLE';
      addLog(`CRITICAL_ERR: SIGNAL_INTERRUPTED.`, "error");
      
      if (errorMsg.includes("credits") || errorMsg.includes("402") || errorMsg.includes("Payment Required")) {
        addLog(`Cause: INSUFFICIENT_CREDITS. Please check your balance in Settings.`, "error");
      } else {
        addLog(`Cause: ${errorMsg}`, "error");
      }
      console.error("Scan Error Details:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const finalizeMission = async () => {
    if (!brand.logos?.main) {
      alert("LOGO_REQUIRED: Mission cannot proceed without visual identity.");
      setOnboardingStep(3);
      return;
    }
    setAutopilotRunning(true);
    try {
      const plan = await gemini.generateWeeklyPlan(brand, brand.contentLanguage);
      setWeeklyPlan(plan);
      setOnboardingStep(0); 
    } catch (e: any) {
      addLog(`AUTOPILOT_CRITICAL_FAILURE: ${e.message}`, "error");
    } finally {
      setAutopilotRunning(false);
    }
  };

  const handleStepBack = () => onboardingStep > 1 && setOnboardingStep(onboardingStep - 1);
  const handleStepNext = () => {
    if (onboardingStep === 3 && !brand.logos?.main) return;
    if (onboardingStep < 5) setOnboardingStep(onboardingStep + 1);
    else finalizeMission();
  };

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white p-6 md:p-12 flex flex-col items-center overflow-y-auto relative pb-32">
      <AutopilotOverlay />

      {/* STEP HUD */}
      <div className="w-full max-w-4xl mb-12 relative flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="absolute top-1/2 left-8 right-8 h-[1px] bg-white/5 -translate-y-1/2" />
        {[<Globe />, <Briefcase />, <Palette />, <Mic2 />, <Share2 />].map((icon, idx) => {
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
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${isActive ? 'bg-[#34E0F7] text-black shadow-[0_0_20px_#34E0F7]' : isCompleted ? 'bg-[#8C4DFF] text-white' : 'bg-[#0A0A12] text-white/40'}`}
              >
                {icon}
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-4xl z-10">
        <AnimatePresence mode="wait">
          {onboardingStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="glass-panel p-10 rounded-3xl border-cyan-500/20 shadow-2xl">
                <h2 className="text-3xl font-black font-orbitron mb-2 text-white uppercase tracking-tighter">1. {t.onboarding.step1}</h2>
                <p className="text-white/40 text-[10px] font-orbitron uppercase tracking-widest mb-10">{t.onboarding.step1Desc}</p>
                <div className="space-y-6">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder={t.onboarding.scanPlaceholder} 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)} 
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-6 outline-none focus:border-[#34E0F7] transition-all font-mono text-sm pr-16" 
                    />
                    <Globe className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#34E0F7] transition-colors" />
                  </div>
                  
                  <div className="space-y-4">
                    <NeonButton 
                      variant="cyan" 
                      className="w-full py-5 font-black text-lg" 
                      onClick={() => handleScan()} 
                      disabled={isScanning || !url || isLoadingAICredits || (!aiSettings && !!workspaceId) || isRepairing}
                    >
                      {isScanning ? 'SCANNING...' : (isLoadingAICredits || (!aiSettings && !!workspaceId)) ? 'INITIALIZING...' : (isRepairing ? 'REPAIRING LINK...' : 'SCAN UNIVERSE')}
                    </NeonButton>
                    
                    {((!aiSettings?.creditBalance || aiSettings.creditBalance <= 0) && credits <= 0) && !isLoadingAICredits && (!!aiSettings || !workspaceId) && (
                      <p className="text-[9px] font-orbitron text-center text-magenta-500 uppercase tracking-widest animate-pulse">
                        {isRepairing ? 'REPAIRING NEURAL LINK... PLEASE WAIT' : 'INSUFFICIENT CREDITS. PLEASE RECHARGE IN SETTINGS.'}
                      </p>
                    )}
                  </div>
                </div>

                {(isScanning || logs.length > 0) && (
                  <div className="mt-10 bg-black/80 border border-white/10 rounded-2xl p-6 font-mono text-xs h-48 overflow-y-auto scrollbar-hide space-y-2" ref={consoleRef}>
                    {logs.map((log, i) => (
                      <div key={i} className={`flex items-start gap-2 ${log.type === 'error' ? "text-red-500 font-bold" : log.type === 'warn' ? "text-yellow-500" : log.type === 'source' ? "text-cyan-500/50 italic text-[10px]" : i === logs.length - 1 ? "text-[#34E0F7] animate-pulse" : "text-white/30"}`}>
                        {log.type === 'source' && <ExternalLink size={10} className="mt-1 shrink-0" />}
                        {log.type === 'error' && <AlertCircle size={10} className="mt-1 shrink-0" />}
                        <span className="break-all">{log.msg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {scanComplete && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <NeonButton variant="cyan" className="w-full py-6 text-xl font-black shadow-[0_0_30px_rgba(52,224,247,0.3)]" onClick={handleStepNext}>DALEJ: ANALIZA DNA</NeonButton>
                </motion.div>
              )}
            </motion.div>
          )}

          {onboardingStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="space-y-8">
              <div className="glass-panel p-10 rounded-3xl border-[#8C4DFF]/20 shadow-2xl">
                <h2 className="text-3xl font-black font-orbitron mb-8 text-white uppercase tracking-widest text-center">2. DNA MARKI</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Nazwa Marki</label>
                    <input type="text" value={brand.name} onChange={e => updateBrand({ name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#8C4DFF] text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Branża</label>
                    <input type="text" value={brand.industry} onChange={e => updateBrand({ industry: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#8C4DFF] text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Opis Marki (Brand Bio)</label>
                  <textarea value={brand.description} onChange={e => updateBrand({ description: e.target.value })} placeholder="Szczegółowy opis marki, który AI wykorzysta do personalizacji postów..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[160px] resize-none text-sm outline-none focus:border-[#8C4DFF] text-white/80" />
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
              <div className="glass-panel p-10 rounded-3xl border-[#C74CFF]/20 shadow-2xl">
                <h2 className="text-3xl font-black font-orbitron mb-10 text-white uppercase tracking-widest text-center">3. TOŻSAMOŚĆ WIZUALNA</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Logo Główne</label>
                      <div className="aspect-square glass-panel border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                        {brand.logos?.main ? (
                          <>
                            <img src={brand.logos.main} className="max-w-[80%] max-h-[80%] object-contain glow-cyan" alt="Logo" />
                            <button onClick={() => updateBrand({ logos: { ...brand.logos, main: undefined } })} className="absolute top-4 right-4 text-white/40 hover:text-red-500"><X /></button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-4 cursor-pointer relative">
                            <CloudUpload size={40} className="text-[#34E0F7]" />
                            <span className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">UPLOAD LOGO</span>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => updateBrand({ logos: { ...brand.logos, main: reader.result as string } });
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </div>
                        )}
                      </div>
                   </div>
                   <div className="space-y-6">
                      <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Paleta Kolorów</label>
                      <div className="grid grid-cols-1 gap-4">
                        {brand.colors.map((c, i) => (
                          <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                            <input type="color" value={c.hex} onChange={e => {
                                const nc = [...brand.colors]; nc[i].hex = e.target.value; updateBrand({ colors: nc });
                            }} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                            <span className="text-[10px] font-orbitron text-white/60 uppercase">{c.name}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={handleStepBack} className="p-4 border border-white/10 rounded-2xl"><ChevronLeft /></button>
                 <NeonButton variant="magenta" className="flex-1 py-5 font-black" onClick={handleStepNext} disabled={!brand.logos?.main}>NASTĘPNY ETAP: VOICE</NeonButton>
              </div>
            </motion.div>
          )}

          {onboardingStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="space-y-8">
              <div className="glass-panel p-10 rounded-3xl border-cyan-500/20 shadow-2xl">
                <h2 className="text-3xl font-black font-orbitron mb-8 text-white uppercase tracking-widest text-center">4. GŁOS MARKI</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {['premium', 'warm', 'modern', 'storyteller'].map(tone => (
                    <button key={tone} onClick={() => updateBrand({ voiceProfile: tone as any })} className={`p-4 rounded-2xl border transition-all text-[10px] font-orbitron uppercase tracking-widest ${brand.voiceProfile === tone ? 'border-[#34E0F7] bg-[#34E0F7]/10 text-[#34E0F7]' : 'border-white/5 text-white/30 hover:bg-white/5'}`}>
                      {tone}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between p-8 bg-[#C74CFF]/5 border border-[#C74CFF]/30 rounded-[2rem] cursor-pointer hover:bg-[#C74CFF]/10 transition-all" onClick={() => updateBrand({ isYodaMode: !brand.isYodaMode })}>
                   <div className="flex items-center gap-6">
                      <YodaIcon active={brand.isYodaMode} />
                      <div>
                        <span className={`text-[11px] font-orbitron uppercase tracking-[0.2em] font-black block ${brand.isYodaMode ? 'text-[#C74CFF]' : 'text-white/40'}`}>TRYB MISTRZA YODY</span>
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Inverted syntax mode</span>
                      </div>
                   </div>
                   <div className={`w-12 h-6 rounded-full relative transition-colors ${brand.isYodaMode ? 'bg-[#C74CFF]' : 'bg-white/10'}`}>
                      <motion.div animate={{ x: brand.isYodaMode ? 26 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                   </div>
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={handleStepBack} className="p-4 border border-white/10 rounded-2xl"><ChevronLeft /></button>
                 <NeonButton variant="cyan" className="flex-1 py-5 font-black" onClick={handleStepNext}>NASTĘPNY ETAP: SYNC</NeonButton>
              </div>
            </motion.div>
          )}

          {onboardingStep === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="space-y-8">
              <div className="glass-panel p-10 rounded-3xl border-white/5 shadow-2xl">
                <h2 className="text-3xl font-black font-orbitron mb-8 text-white uppercase tracking-widest text-center">5. WĘZŁY KOMUNIKACYJNE</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['instagram', 'facebook', 'linkedin', 'tiktok'].map(p => (
                    <div key={p} onClick={() => toggleSocialLink(p)} className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${socialLinks[p as keyof typeof socialLinks] ? 'border-[#34E0F7] bg-[#34E0F7]/5' : 'border-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-orbitron uppercase tracking-widest">{p}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={handleStepBack} className="p-4 border border-white/10 rounded-2xl"><ChevronLeft /></button>
                 <NeonButton variant="cyan" className="flex-1 py-6 font-black text-xl shadow-[0_0_50px_rgba(52,224,247,0.4)]" onClick={finalizeMission}>ODPAL MISJĘ <Rocket className="ml-2 inline" /></NeonButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
