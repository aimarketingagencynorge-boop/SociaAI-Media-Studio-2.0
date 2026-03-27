
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
  FileText,
  Instagram,
  Facebook,
  Linkedin,
  Music2,
  Eye,
  Layout,
  Flag,
  Compass,
  Edit3,
  Star,
  Maximize2,
  X,
  Settings2,
  Sliders
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';
import { BrandAsset, Language, PlatformDNA, BrandData, BrandReferenceImage, ReferenceTag } from '../types';

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
    addReferenceImage,
    addReferenceImages,
    removeReferenceImage,
    updateReferenceImage,
    updateReferenceSettings,
    syncAllPostsWithBrand,
    triggerOutboundEvent,
    userId,
    workspaceId
  } = useStore();
  
  const t = translations[language];
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('DNA_SYNC_COMPLETE');
  const [editingImage, setEditingImage] = useState<BrandReferenceImage | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const timeoutsRef = React.useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const triggerToast = (msg: string, duration = 3000) => {
    setToastMsg(msg);
    setShowToast(true);
    const timeout = setTimeout(() => setShowToast(false), duration);
    timeoutsRef.current.push(timeout);
  };

  const consistencyScore = useMemo(() => {
    if (!brand) return 0;
    let score = 0;
    if (brand.logos?.main) score += 10;
    const assetScore = (brand.referenceImages?.length || 0) * 5;
    score += Math.min(assetScore, 25);
    if (brand.voiceProfile) score += 10;
    if (brand.coreMission && brand.coreMission.length > 10) score += 5;
    if (brand.description && brand.description.length > 30) score += 5;
    if (brand.whatWeDo && brand.whatWeDo.length > 10) score += 5;
    if (brand.howWeDoIt && brand.howWeDoIt.length > 10) score += 5;
    if (brand.brandPerception && brand.brandPerception.length > 10) score += 5;
    if (brand.pillars?.every(p => p.length > 2)) score += 10;
    
    const platformScore = Object.values(brand.platformDNA || {}).filter(p => p.positioning && p.goal).length * 5;
    score += platformScore;

    if (brand.isYodaMode) score += 5;
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

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = (brand.referenceImages || []).length;
    if (currentCount >= 20) {
      triggerToast(t.brandKit.maxReferenceImagesReached);
      return;
    }

    const fileList = Array.from(files);
    const availableSlots = 20 - currentCount;
    const filesToProcess = fileList.slice(0, availableSlots);
    
    const newImages: BrandReferenceImage[] = [];

    for (const file of filesToProcess) {
      try {
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          userId,
          workspaceId,
          imageUrl: imageData,
          title: file.name.split('.')[0],
          note: '',
          tags: ['STYLE'],
          priority: 'secondary',
          platforms: ['instagram', 'facebook'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error reading file:", file.name, err);
      }
    }
    
    if (newImages.length > 0) {
      addReferenceImages(newImages);
      triggerToast(`${newImages.length} ${t.brandKit.referenceImagesAdded || 'Images Added'}`);
    }
    
    // Clear the input so the same files can be selected again
    e.target.value = '';
  };

  const updatePlatformDNA = (platform: keyof BrandData['platformDNA'], field: keyof PlatformDNA, value: string) => {
    updateBrand({
      platformDNA: {
        ...brand.platformDNA,
        [platform]: {
          ...(brand.platformDNA?.[platform] || { positioning: '', contentFocus: '', visualDirection: '', goal: '' }),
          [field]: value
        }
      }
    });
  };

  const handleSyncDNA = () => {
    setIsSyncing(true);
    // Sync all existing posts with new brand signature/data
    syncAllPostsWithBrand((content, brand) => gemini.buildFinalContent(content, brand));
    
    triggerOutboundEvent({
      eventType: 'brand_updated',
      sourceModule: 'brand-kit',
      metadata: {
        action: 'sync_all_posts',
        brandName: brand.name
      }
    });

    const timeout = setTimeout(() => {
      setIsSyncing(false);
      triggerToast(t.brandKit.dnaSyncComplete);
    }, 1500);
    timeoutsRef.current.push(timeout);
  };

  const handleRefineBrand = async () => {
    if (!refinePrompt.trim()) return;
    setIsRefining(true);
    try {
      const refinedData = await gemini.refineBrandDNA(brand, refinePrompt, language);
      updateBrand(refinedData);

      triggerOutboundEvent({
        eventType: 'brand_updated',
        sourceModule: 'brand-kit',
        metadata: {
          action: 'ai_refine',
          prompt: refinePrompt
        }
      });

      setRefinePrompt('');
      setShowRefineInput(false);
      triggerToast(t.brandKit.dnaRefinedByAI);
    } catch (e) {
      console.error(e);
      alert(t.brandKit.dnaRefinementFailed);
    } finally {
      setIsRefining(false);
    }
  };

  const voiceProfiles = [
    { id: 'premium', label: t.brandKit.voiceProfiles.premium.label, icon: <Sparkles size={18} />, desc: t.brandKit.voiceProfiles.premium.desc },
    { id: 'warm', label: t.brandKit.voiceProfiles.warm.label, icon: <Smile size={18} />, desc: t.brandKit.voiceProfiles.warm.desc },
    { id: 'modern', label: t.brandKit.voiceProfiles.modern.label, icon: <Zap size={18} />, desc: t.brandKit.voiceProfiles.modern.desc },
    { id: 'storyteller', label: t.brandKit.voiceProfiles.storyteller.label, icon: <BookOpen size={18} />, desc: t.brandKit.voiceProfiles.storyteller.desc },
    { id: 'corporate', label: t.brandKit.voiceProfiles.corporate.label, icon: <Target size={18} />, desc: t.brandKit.voiceProfiles.corporate.desc }
  ];

  const platforms = [
    { id: 'instagram', label: 'Instagram', icon: <Instagram size={18} />, color: '#E4405F' },
    { id: 'facebook', label: 'Facebook', icon: <Facebook size={18} />, color: '#1877F2' },
    { id: 'tiktok', label: 'TikTok', icon: <Music2 size={18} />, color: '#000000' },
    { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={18} />, color: '#0A66C2' }
  ];

  if (!brand) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center glass-panel p-12 rounded-3xl">
        <RefreshCw className="w-12 h-12 text-[#C74CFF] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-orbitron uppercase text-white/40 tracking-[0.4em]">Initializing Brand DNA...</h2>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar relative bg-transparent">
      <div className="p-8 lg:p-12 max-w-[1500px] mx-auto space-y-16 pb-48">
        
        {/* HUD HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 glass-panel p-10 rounded-[2rem] border-white/10 relative overflow-hidden bg-black/40 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#34E0F7]/5 via-transparent to-[#8C4DFF]/5 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <h2 className="text-4xl md:text-5xl font-black font-orbitron tracking-tight text-white leading-none">
              SociAI MediA Studio : <span className="text-[#34E0F7]">{t.brandKit.title}</span>
            </h2>
            <p className="text-white/20 uppercase tracking-[0.4em] text-[9px] font-orbitron font-bold">{t.brandKit.dnaConsistency}: {brand.contentLanguage}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 w-full xl:w-auto">
             <div className="flex flex-col items-end gap-3 min-w-[200px]">
                <div className="flex items-center gap-4">
                   <span className="text-[11px] font-orbitron text-white/40 uppercase tracking-widest font-black">{t.brandKit.dnaConsistency}</span>
                   <span className="text-5xl font-black font-orbitron text-[#34E0F7] shadow-sm">{consistencyScore}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${consistencyScore}%` }} className="h-full bg-gradient-to-r from-[#8C4DFF] to-[#34E0F7]" />
                </div>
             </div>
             <div className="flex flex-col gap-2 w-full sm:w-auto">
                <NeonButton variant="purple" onClick={handleSyncDNA} disabled={isSyncing} className="w-full">
                   {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />} SYNC DNA
                </NeonButton>
                <button 
                  onClick={() => setShowRefineInput(!showRefineInput)}
                  className="text-[9px] font-orbitron text-[#C74CFF] hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} /> {t.brandKit.refineWithAI}
                </button>
             </div>
          </div>
        </header>

        <AnimatePresence>
          {showRefineInput && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-panel p-8 rounded-[2rem] border-[#C74CFF]/30 bg-[#C74CFF]/5 mb-12 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-orbitron text-[#C74CFF] uppercase tracking-widest font-black">{t.brandKit.aiDNAArchitect}</label>
                  <input 
                    type="text" 
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder={t.brandKit.aiDNAArchitectPlaceholder}
                    className="w-full bg-black/40 border border-[#C74CFF]/30 rounded-xl p-4 text-sm text-white outline-none focus:border-[#C74CFF] transition-all"
                  />
                </div>
                <NeonButton 
                  variant="purple" 
                  onClick={handleRefineBrand} 
                  disabled={isRefining || !refinePrompt.trim()}
                  className="px-8 py-4"
                >
                  {isRefining ? <RefreshCw size={18} className="animate-spin" /> : <Rocket size={18} />} {t.brandKit.execute}
                </NeonButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VOICE & YODA */}
        <section className="glass-panel p-12 rounded-[3rem] border-white/10 flex flex-col space-y-12 bg-black/20 shadow-2xl">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-8">
             <div className="flex items-center gap-5">
               <div className="p-4 bg-[#C74CFF]/10 rounded-2xl border border-[#C74CFF]/20">
                  <Mic2 size={24} className="text-[#C74CFF]" />
               </div>
               <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">{t.brandKit.voiceArchitect}</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">{t.brandKit.voiceArchitectDesc}</p>
               </div>
             </div>

             <div className="flex items-center gap-4 bg-[#C74CFF]/5 border border-[#C74CFF]/30 p-4 rounded-2xl cursor-pointer hover:bg-[#C74CFF]/10 transition-all" onClick={() => updateBrand({ isYodaMode: !brand.isYodaMode })}>
                <YodaIcon active={brand.isYodaMode} />
                <div className="flex flex-col">
                  <span className={`text-[10px] font-orbitron uppercase tracking-widest font-black ${brand.isYodaMode ? 'text-[#C74CFF]' : 'text-white/40'}`}>{t.brandKit.yodaStyle}</span>
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{t.brandKit.yodaStyleDesc}</span>
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

        {/* DNA PROCESSOR PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: CORE & VISUAL */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. CORE BRAND INTEL */}
            <section className="glass-panel rounded-[3rem] border-white/10 overflow-hidden flex flex-col bg-black/40 border-l-4 border-l-[#34E0F7] shadow-2xl">
              <div className="p-10 border-b border-white/5 flex items-center gap-5 bg-white/[0.02]">
                <div className="p-4 bg-[#34E0F7]/10 rounded-2xl border border-[#34E0F7]/20">
                  <Dna size={24} className="text-[#34E0F7]" />
                </div>
                <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">{t.brandKit.coreBrandIntel}</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">{t.brandKit.coreBrandIntelDesc}</p>
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Content Language Selector */}
                  <div className="space-y-4 md:col-span-2 p-6 rounded-2xl bg-[#34E0F7]/5 border border-[#34E0F7]/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-widest flex items-center gap-2 font-black">
                          <Globe size={14} /> {t.brandKit.contentLanguage}
                        </label>
                        <p className="text-[9px] text-white/40 font-inter max-w-md">
                          {t.brandKit.contentLanguageDesc}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {(['EN', 'NO', 'PL', 'RU'] as Language[]).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => updateBrand({ contentLanguage: lang })}
                            className={`px-4 py-2 rounded-lg text-[10px] font-orbitron transition-all border ${
                              brand.contentLanguage === lang 
                                ? 'bg-[#34E0F7] text-black border-[#34E0F7] shadow-[0_0_15px_#34E0F744]' 
                                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-2 font-black">
                      <FileText size={14} className="text-[#34E0F7]"/> {t.brandKit.fullDescription}
                    </label>
                    <textarea 
                      value={brand.description}
                      onChange={(e) => updateBrand({ description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all text-white/80 min-h-[120px] resize-none"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-2 font-black">
                      <Target size={14} className="text-[#34E0F7]"/> {t.brandKit.brandMission}
                    </label>
                    <textarea 
                      value={brand.coreMission}
                      onChange={(e) => updateBrand({ coreMission: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all text-white/80 min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-2 font-black">
                      <Zap size={14} className="text-[#34E0F7]"/> {t.brandKit.whatWeDo}
                    </label>
                    <textarea 
                      value={brand.whatWeDo}
                      onChange={(e) => updateBrand({ whatWeDo: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all text-white/80 min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-2 font-black">
                      <RefreshCw size={14} className="text-[#34E0F7]"/> {t.brandKit.howWeDoIt}
                    </label>
                    <textarea 
                      value={brand.howWeDoIt}
                      onChange={(e) => updateBrand({ howWeDoIt: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all text-white/80 min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest flex items-center gap-2 font-black">
                      <Eye size={14} className="text-[#34E0F7]"/> {t.brandKit.brandPerception}
                    </label>
                    <textarea 
                      value={brand.brandPerception}
                      onChange={(e) => updateBrand({ brandPerception: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all text-white/80 min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. BRAND PILLARS */}
            <section className="glass-panel p-10 rounded-[3rem] border-white/10 bg-black/40 space-y-8">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#34E0F7]/10 rounded-2xl border border-[#34E0F7]/20">
                  <Hexagon size={24} className="text-[#34E0F7]" />
                </div>
                <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">{t.brandKit.brandPillars}</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">{t.brandKit.brandPillarsDesc}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(brand.pillars || ['', '', '']).map((p, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-black border border-white/10 rounded-lg flex items-center justify-center text-[10px] font-orbitron text-[#34E0F7] font-black z-10">0{i+1}</div>
                    <input 
                      type="text" 
                      value={p} 
                      onChange={(e) => {
                        const newPillars = [...(brand.pillars || ['', '', ''])];
                        newPillars[i] = e.target.value;
                        updateBrand({ pillars: newPillars });
                      }} 
                      placeholder={`${t.brandKit.pillarPlaceholder} 0${i+1}`} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[12px] font-inter focus:border-[#34E0F7] outline-none transition-all text-white/80" 
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* 4. SOCIAL PLATFORM DNA */}
            <section className="glass-panel p-10 rounded-[3rem] border-white/10 bg-black/40 space-y-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#34E0F7]/10 rounded-2xl border border-[#34E0F7]/20">
                  <Layout size={24} className="text-[#34E0F7]" />
                </div>
                <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">{t.brandKit.socialPlatformDNA}</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">{t.brandKit.socialPlatformDNADesc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {platforms.map((platform) => (
                  <div key={platform.id} className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white/5 text-white/60" style={{ color: platform.color }}>
                          {platform.icon}
                        </div>
                        <span className="text-[12px] font-orbitron font-black text-white uppercase tracking-widest">{platform.label}</span>
                      </div>
                      <div className="h-[1px] flex-1 mx-4 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-orbitron text-white/30 uppercase tracking-widest">{t.brandKit.positioning}</label>
                        <input 
                          type="text"
                          value={brand.platformDNA?.[platform.id as keyof BrandData['platformDNA']]?.positioning || ''}
                          onChange={(e) => updatePlatformDNA(platform.id as any, 'positioning', e.target.value)}
                          placeholder={t.brandKit.positioning}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white/70 focus:border-[#34E0F7] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-orbitron text-white/30 uppercase tracking-widest">{t.brandKit.contentFocus}</label>
                        <input 
                          type="text"
                          value={brand.platformDNA?.[platform.id as keyof BrandData['platformDNA']]?.contentFocus || ''}
                          onChange={(e) => updatePlatformDNA(platform.id as any, 'contentFocus', e.target.value)}
                          placeholder={t.brandKit.contentFocus}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white/70 focus:border-[#34E0F7] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-orbitron text-white/30 uppercase tracking-widest">{t.brandKit.visualDirection}</label>
                        <input 
                          type="text"
                          value={brand.platformDNA?.[platform.id as keyof BrandData['platformDNA']]?.visualDirection || ''}
                          onChange={(e) => updatePlatformDNA(platform.id as any, 'visualDirection', e.target.value)}
                          placeholder={t.brandKit.visualDirection}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white/70 focus:border-[#34E0F7] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: VISUAL IDENTITY & REFERENCE IMAGES */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* 2. VISUAL IDENTITY */}
            <section className="glass-panel p-10 rounded-[3rem] border-white/10 bg-black/40 space-y-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#34E0F7]/10 rounded-2xl border border-[#34E0F7]/20">
                  <Palette size={24} className="text-[#34E0F7]" />
                </div>
                <div>
                  <h3 className="font-orbitron text-[15px] uppercase tracking-[0.5em] font-black text-white">{t.brandKit.visualIdentity}</h3>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">{t.brandKit.visualIdentityDesc}</p>
                </div>
              </div>

              {/* LOGO SECTION */}
              <div className="space-y-6">
                <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest font-black">{t.brandKit.brandLogo}</label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative group aspect-video rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    {brand.logos?.main ? (
                      <img src={brand.logos.main} alt="Main Logo" className="max-h-[70%] max-w-[70%] object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <CloudUpload size={32} />
                        <span className="text-[9px] font-orbitron uppercase tracking-widest">Upload_Main_Logo</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleLogoUpload('main', e)} 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <RefreshCw size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLORS SECTION */}
              <div className="space-y-6">
                <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest font-black">{t.brandKit.brandColors}</label>
                <div className="grid grid-cols-2 gap-4">
                  {brand.colors.map((color, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="w-full h-12 rounded-xl shadow-inner" style={{ backgroundColor: color.hex }} />
                      <div className="space-y-1">
                        <input 
                          type="text" 
                          value={color.name} 
                          onChange={(e) => {
                            const newColors = [...brand.colors];
                            newColors[i].name = e.target.value;
                            updateBrand({ colors: newColors });
                          }}
                          className="w-full bg-transparent text-[9px] font-orbitron text-white/60 uppercase outline-none" 
                        />
                        <input 
                          type="text" 
                          value={color.hex} 
                          onChange={(e) => {
                            const newColors = [...brand.colors];
                            newColors[i].hex = e.target.value;
                            updateBrand({ colors: newColors });
                          }}
                          className="w-full bg-transparent text-[11px] font-mono text-[#34E0F7] outline-none" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 5. REFERENCE IMAGES */}
            <section className="glass-panel p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border-white/10 bg-black/40 space-y-8">
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="p-3 sm:p-4 bg-[#34E0F7]/10 rounded-xl sm:rounded-2xl border border-[#34E0F7]/20">
                      <ImageIcon size={20} className="text-[#34E0F7] sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="font-orbitron text-[13px] sm:text-[15px] uppercase tracking-[0.3em] sm:tracking-[0.5em] font-black text-white">{t.brandKit.referenceImages}</h3>
                      <p className="text-[8px] sm:text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">{t.brandKit.referenceImagesSubtitle}</p>
                    </div>
                  </div>
                  
                  <div className="relative group shrink-0">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleReferenceUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                    />
                    <div className="p-3 sm:p-4 bg-[#34E0F7] text-black rounded-xl sm:rounded-2xl shadow-[0_0_20px_#34E0F744] group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                      <Plus size={20} className="sm:w-6 sm:h-6" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-white/5 rounded-3xl border border-white/10">
                  <div className="flex items-center justify-between gap-3 px-2">
                    <span className="text-[8px] sm:text-[9px] font-orbitron text-white/40 uppercase tracking-widest">{t.brandKit.useInGeneration}</span>
                    <button 
                      onClick={() => updateReferenceSettings({ useInGeneration: !brand.referenceSettings?.useInGeneration })}
                      className={`w-8 h-4 sm:w-10 sm:h-5 rounded-full relative transition-colors ${brand.referenceSettings?.useInGeneration ? 'bg-[#34E0F7]' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: brand.referenceSettings?.useInGeneration ? 18 : 2 }}
                        className="absolute top-0.5 sm:top-1 w-3 h-3 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
                    <span className="text-[8px] sm:text-[9px] font-orbitron text-white/40 uppercase tracking-widest">{t.brandKit.referenceStrength}</span>
                    <select 
                      value={brand.referenceSettings?.strength || 'medium'}
                      onChange={(e) => updateReferenceSettings({ strength: e.target.value as any })}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[8px] sm:text-[9px] font-orbitron text-white outline-none focus:border-[#34E0F7] transition-all"
                    >
                      <option value="low">{t.brandKit.low}</option>
                      <option value="medium">{t.brandKit.medium}</option>
                      <option value="high">{t.brandKit.high}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {(brand.referenceImages || []).map((image) => (
                  <motion.div 
                    layoutId={image.id}
                    key={image.id} 
                    className={`group relative aspect-square rounded-[2rem] overflow-hidden border transition-all duration-500 ${image.priority === 'primary' ? 'border-[#34E0F7] shadow-[0_0_20px_#34E0F733]' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                  >
                    <img src={image.imageUrl} alt={image.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    {/* PRIORITY BADGE */}
                    {image.priority === 'primary' && (
                      <div className="absolute top-4 left-4 p-1.5 bg-[#34E0F7] text-black rounded-lg shadow-lg z-20">
                        <Star size={12} fill="currentColor" />
                      </div>
                    )}

                    {/* HOVER ACTIONS */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { setEditingImage(image); setIsPreviewOpen(true); }}
                          className="p-3 bg-white/10 text-white rounded-xl hover:bg-[#34E0F7] hover:text-black transition-all"
                        >
                          <Maximize2 size={18} />
                        </button>
                        <button 
                          onClick={() => setEditingImage(image)}
                          className="p-3 bg-white/10 text-white rounded-xl hover:bg-[#C74CFF] hover:text-white transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => removeReferenceImage(image.id)}
                          className="p-3 bg-white/10 text-white rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="text-center space-y-1">
                        <p className="text-[10px] font-orbitron font-black text-white uppercase tracking-widest truncate max-w-full px-2">{image.title}</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {image.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[7px] font-mono text-[#34E0F7] uppercase border border-[#34E0F7]/30 px-1.5 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => updateReferenceImage(image.id, { priority: image.priority === 'primary' ? 'secondary' : 'primary' })}
                        className={`mt-2 text-[8px] font-orbitron uppercase tracking-widest flex items-center gap-2 ${image.priority === 'primary' ? 'text-[#34E0F7]' : 'text-white/40 hover:text-white'}`}
                      >
                        <Star size={10} fill={image.priority === 'primary' ? 'currentColor' : 'none'} />
                        {image.priority === 'primary' ? t.brandKit.primary : t.brandKit.setPrimary}
                      </button>
                    </div>
                  </motion.div>
                ))}
                {(brand.referenceImages || []).length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center gap-6 opacity-20 border-2 border-dashed border-white/10 rounded-[3rem]">
                    <ImageIcon size={60} />
                    <div className="text-center space-y-2">
                      <p className="text-[12px] font-orbitron uppercase tracking-[0.3em] font-black">{t.brandKit.noReferenceAssets}</p>
                      <p className="text-[9px] font-inter max-w-xs">{t.brandKit.referenceImagesSubtitle}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* REFERENCE EDIT MODAL */}
            <AnimatePresence>
              {editingImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setEditingImage(null); setIsPreviewOpen(false); }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-5xl glass-panel rounded-[3rem] border-white/10 overflow-hidden flex flex-col lg:flex-row bg-black shadow-[0_0_100px_rgba(52,224,247,0.1)]"
                  >
                    {/* IMAGE PREVIEW SIDE */}
                    <div className="lg:w-3/5 bg-white/[0.02] flex items-center justify-center p-8 border-b lg:border-b-0 lg:border-r border-white/5">
                      <div className="relative w-full aspect-square lg:aspect-auto lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                        <img src={editingImage.imageUrl} alt={editingImage.title} className="w-full h-full object-contain" />
                      </div>
                    </div>

                    {/* DATA EDIT SIDE */}
                    <div className="lg:w-2/5 p-10 space-y-8 overflow-y-auto max-h-[80vh] lg:max-h-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-[#34E0F7]/10 rounded-xl border border-[#34E0F7]/20">
                            <Settings2 size={20} className="text-[#34E0F7]" />
                          </div>
                          <h4 className="font-orbitron text-lg font-black text-white uppercase tracking-widest">{t.brandKit.editReference}</h4>
                        </div>
                        <button 
                          onClick={() => { setEditingImage(null); setIsPreviewOpen(false); }}
                          className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* TITLE */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.brandKit.brandName}</label>
                          <input 
                            type="text"
                            value={editingImage.title}
                            onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[13px] text-white outline-none focus:border-[#34E0F7] transition-all"
                          />
                        </div>

                        {/* NOTE */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.brandKit.note}</label>
                          <textarea 
                            value={editingImage.note}
                            onChange={(e) => setEditingImage({ ...editingImage, note: e.target.value })}
                            placeholder={t.brandKit.notePlaceholder}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[13px] text-white outline-none focus:border-[#34E0F7] transition-all min-h-[100px] resize-none"
                          />
                        </div>

                        {/* PRIORITY */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.brandKit.priority}</label>
                          <div className="flex gap-4">
                            <button 
                            onClick={() => setEditingImage({ ...editingImage, priority: 'primary' })}
                              className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-2 font-orbitron text-[10px] uppercase tracking-widest ${editingImage.priority === 'primary' ? 'bg-[#34E0F7] border-[#34E0F7] text-black font-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'}`}
                            >
                              <Star size={14} fill={editingImage.priority === 'primary' ? 'currentColor' : 'none'} />
                              {t.brandKit.primary}
                            </button>
                            <button 
                            onClick={() => setEditingImage({ ...editingImage, priority: 'secondary' })}
                              className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-2 font-orbitron text-[10px] uppercase tracking-widest ${editingImage.priority === 'secondary' ? 'bg-white/10 border-white/30 text-white font-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'}`}
                            >
                              {t.brandKit.secondary}
                            </button>
                          </div>
                        </div>

                        {/* TAGS */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.brandKit.tags}</label>
                          <div className="flex flex-wrap gap-2">
                            {(['INTERIOR', 'PRODUCT', 'FOOD', 'TEAM', 'EVENT', 'MOOD', 'BRANDING', 'LOCATION', 'STYLE', 'VENUE'] as ReferenceTag[]).map(tag => (
                              <button 
                                key={tag}
                                onClick={() => {
                                  const newTags = editingImage.tags.includes(tag) 
                                    ? editingImage.tags.filter(t => t !== tag)
                                    : [...editingImage.tags, tag];
                                  setEditingImage({ ...editingImage, tags: newTags });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase transition-all border ${editingImage.tags.includes(tag) ? 'bg-[#34E0F7]/20 border-[#34E0F7] text-[#34E0F7]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* PLATFORMS */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.brandKit.platforms}</label>
                          <div className="flex gap-2">
                            {platforms.map(p => (
                              <button 
                                key={p.id}
                                onClick={() => {
                                  const newPlatforms = (editingImage.platforms || []).includes(p.id as any)
                                    ? (editingImage.platforms || []).filter(id => id !== p.id)
                                    : [...(editingImage.platforms || []), p.id as any];
                                  setEditingImage({ ...editingImage, platforms: newPlatforms });
                                }}
                                className={`p-3 rounded-xl transition-all border ${ (editingImage.platforms || []).includes(p.id as any) ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/20 hover:border-white/20'}`}
                                title={p.label}
                              >
                                {p.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex gap-4">
                        <NeonButton variant="cyan" onClick={() => {
                          updateReferenceImage(editingImage.id, editingImage);
                          handleSyncDNA();
                          setEditingImage(null);
                        }} className="flex-1 py-4">
                          {t.common.save}
                        </NeonButton>
                        <button 
                          onClick={() => { removeReferenceImage(editingImage.id); setEditingImage(null); }}
                          className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* SAVE ACTION HUD */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
           <NeonButton variant="cyan" onClick={handleSyncDNA} disabled={isSyncing} className="px-12 py-5 text-lg">
              {isSyncing ? <RefreshCw className="animate-spin" /> : <Save size={24} />} 
              <span className="ml-3 font-black tracking-widest">{t.brandKit.saveDNA}</span>
           </NeonButton>
        </div>

        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {showToast && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[#34E0F7] text-black px-8 py-4 rounded-2xl font-orbitron font-black uppercase tracking-widest text-xs shadow-[0_0_30px_#34E0F766] z-[60] flex items-center gap-3"
            >
              <CheckCircle2 size={18} /> {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BrandKit;
