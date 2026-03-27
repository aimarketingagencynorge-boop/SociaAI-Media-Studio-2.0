
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Type, 
  Upload, 
  CheckCircle2, 
  Download, 
  Calendar, 
  Save, 
  RefreshCw, 
  ChevronRight,
  Globe,
  Palette,
  ShieldCheck,
  Layout,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Plus,
  Star
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';
import SmartVision from './SmartVision';
import { StudioGenerationMode, StudioGeneratedAsset, SocialPost } from '../types';

const getPlatforms = (t: any) => [
  { id: 'instagram', icon: Instagram, label: t.common.instagram },
  { id: 'facebook', icon: Facebook, label: t.common.facebook },
  { id: 'tiktok', icon: Video, label: t.common.tiktok },
  { id: 'linkedin', icon: Linkedin, label: t.common.linkedin },
] as const;

const getModes = (t: any) => [
  { id: 'text-to-image', icon: Type, label: t.studio.modes.textToImage },
  { id: 'image-to-image', icon: ImageIcon, label: t.studio.modes.imageToImage },
  { id: 'text-to-video', icon: Video, label: t.studio.modes.textToVideo },
  { id: 'image-to-video', icon: ImageIcon, label: t.studio.modes.imageToVideo },
] as const;

const AIStudio: React.FC = () => {
  const { language, brand, addStudioAsset, addMediaAsset, addPost, studioAssets, triggerOutboundEvent, setActiveView } = useStore();
  const t = translations[language];
  const MODES = getModes(t);
  const PLATFORMS = getPlatforms(t);

  const [mode, setMode] = useState<StudioGenerationMode>('text-to-image');
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]['id']>('instagram');
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedAsset, setGeneratedAsset] = useState<StudioGeneratedAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Brand DNA Controls
  const [useBrandDNA, setUseBrandDNA] = useState(true);
  const [useLogo, setUseLogo] = useState(false);
  const [useSignature, setUseSignature] = useState(false);
  const [useBrandColors, setUseBrandColors] = useState(false);
  
  // Overlay Controls
  const [overlayText, setOverlayText] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusMessages = [
    "Initializing Neural Link...",
    "Analyzing Brand DNA...",
    "Synthesizing Visual Elements...",
    "Rendering High-Fidelity Frames...",
    "Optimizing Transmission Signal...",
    "Finalizing Asset Construction..."
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && mode !== 'image-to-video') return;
    setIsGenerating(true);
    setGenerationStatus(statusMessages[0]);
    setError(null);
    
    let statusIdx = 1;
    const statusInterval = setInterval(() => {
      setGenerationStatus(statusMessages[statusIdx % statusMessages.length]);
      statusIdx++;
    }, 3000);
    
    try {
      let outputUrl = '';
      if (mode.includes('image')) {
        outputUrl = await gemini.generateStudioImage(
          mode as any, 
          prompt, 
          platform, 
          brand, 
          useBrandDNA, 
          sourceImage || undefined
        );
      } else if (mode.includes('video')) {
        outputUrl = await gemini.generateStudioVideo(
          mode as any, 
          prompt, 
          platform, 
          brand, 
          useBrandDNA, 
          sourceImage || undefined
        );
      } else {
        // Fallback for text-to-image if not caught
        outputUrl = await gemini.generateStudioImage(
          'text-to-image', 
          prompt, 
          platform, 
          brand, 
          useBrandDNA
        );
      }

      const newAsset: StudioGeneratedAsset = {
        id: Math.random().toString(36).substr(2, 9),
        type: mode.includes('video') ? 'video' : 'image',
        mode,
        sourceImageUrl: sourceImage || undefined,
        outputUrl,
        platform,
        createdAt: new Date().toISOString(),
      };

      setGeneratedAsset(newAsset);
      addStudioAsset(newAsset);

      triggerOutboundEvent({
        eventType: 'ai_asset_generated',
        platform: newAsset.platform,
        assetUrl: newAsset.outputUrl,
        sourceModule: 'ai-studio',
        metadata: {
          mode: newAsset.mode,
          type: newAsset.type,
          prompt: prompt
        }
      });
    } catch (err: any) {
      console.error("Generation failed", err);
      setError(err.message || "Generation failed. Please check your connection.");
    } finally {
      clearInterval(statusInterval);
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleSaveToMediaLab = () => {
    if (!generatedAsset) return;
    addMediaAsset({
      id: Math.random().toString(36).substr(2, 9),
      type: generatedAsset.type,
      sourceUrl: generatedAsset.outputUrl,
      createdAt: new Date().toISOString(),
      status: 'original'
    });
  };

  const handleSendToPlanner = () => {
    if (!generatedAsset) return;
    const newPost: SocialPost = {
      id: Math.random().toString(36).substr(2, 9),
      platform: generatedAsset.platform,
      topic: prompt || t.studio.generatedAsset,
      content: prompt || t.studio.generatedWithStudio,
      hook: overlayText || '',
      hashtags: [],
      imageBrief: prompt || t.studio.generatedAsset,
      imagePreviewUrl: generatedAsset.type === 'image' ? generatedAsset.outputUrl : undefined,
      videoUrl: generatedAsset.type === 'video' ? generatedAsset.outputUrl : undefined,
      status: 'draft',
      isApproved: false,
      weekIndex: 0,
      dayIndex: 0,
      showHook: true,
      signatureEnabled: useSignature
    };
    addPost(newPost);
  };

  if (!brand) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center glass-panel p-12 rounded-3xl">
        <RefreshCw className="w-12 h-12 text-[#C74CFF] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-orbitron uppercase text-white/40 tracking-[0.4em]">Initializing AI Studio...</h2>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto pb-32">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#8C4DFF]/20 rounded-lg">
            <Sparkles className="text-[#8C4DFF]" size={24} />
          </div>
          <h2 className="text-4xl font-black font-orbitron tracking-tight text-white">
            {t.studio.title} <span className="text-[#8C4DFF]">{t.studio.forge}</span>
          </h2>
        </div>
        <p className="text-white/40 text-sm font-medium max-w-2xl">
          {t.studio.desc}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mode Selector */}
          <div className="glass-pane p-6 rounded-3xl border-white/5">
            <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest mb-4">{t.studio.genMode}</label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${
                    mode === m.id 
                      ? 'bg-[#8C4DFF]/20 border-[#8C4DFF] text-white' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <m.icon size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Platform Selector */}
          <div className="glass-pane p-6 rounded-3xl border-white/5">
            <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest mb-4">{t.studio.targetPlatform}</label>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 ${
                    platform === p.id 
                      ? 'bg-[#34E0F7]/20 border-[#34E0F7] text-[#34E0F7]' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                  }`}
                  title={p.label}
                >
                  <p.icon size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Reference Library Selector */}
          {(brand.referenceImages || []).length > 0 && (
            <div className="glass-pane p-6 rounded-3xl border-white/5">
              <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest mb-4">{t.brandKit.referenceImages}</label>
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                {(brand.referenceImages || []).map(img => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setSourceImage(img.imageUrl);
                      if (mode === 'text-to-image') setMode('image-to-image');
                      if (mode === 'text-to-video') setMode('image-to-video');
                    }}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      sourceImage === img.imageUrl ? 'border-[#8C4DFF] scale-110 shadow-[0_0_15px_#8C4DFF44]' : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                    {img.priority === 'primary' && (
                      <div className="absolute top-0.5 right-0.5 text-[#34E0F7]">
                        <Star size={8} fill="currentColor" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Section */}
          <div className="glass-pane p-6 rounded-3xl border-white/5 space-y-6">
            {mode.includes('image-to') && (
              <div className="space-y-3">
                <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.studio.refImage}</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-[#8C4DFF]/50 transition-all overflow-hidden group"
                >
                  {sourceImage ? (
                    <>
                      <img src={sourceImage} alt="Reference" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <RefreshCw className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="text-white/20 mb-2" size={24} />
                      <span className="text-[10px] text-white/40 font-bold uppercase">{t.studio.uploadImg}</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.studio.creativeBrief}</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.studio.promptPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[120px] outline-none focus:border-[#8C4DFF] text-sm text-white placeholder:text-white/20 resize-none"
              />
            </div>
          </div>

          {/* Brand DNA Controls */}
          <div className="glass-pane p-6 rounded-3xl border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#34E0F7]" />
                <span className="text-[10px] font-orbitron text-white uppercase tracking-widest">{t.studio.brandDNAEngine}</span>
              </div>
              <button 
                onClick={() => setUseBrandDNA(!useBrandDNA)}
                className={`w-10 h-5 rounded-full transition-colors relative ${useBrandDNA ? 'bg-[#34E0F7]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${useBrandDNA ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {useBrandDNA && (
              <div className="grid grid-cols-1 gap-2 pt-2">
                {[
                  { id: 'logo', label: t.studio.useLogo, active: useLogo, setter: setUseLogo },
                  { id: 'colors', label: t.studio.useColors, active: useBrandColors, setter: setUseBrandColors },
                  { id: 'sig', label: t.studio.useSignature, active: useSignature, setter: setUseSignature },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => opt.setter(!opt.active)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      opt.active ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent text-white/40'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                    {opt.active && <CheckCircle2 size={12} className="text-[#34E0F7]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <NeonButton 
            variant="purple" 
            className="w-full py-6 text-lg font-black"
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt && mode !== 'image-to-video')}
          >
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="animate-spin" size={20} />
                <span>{t.studio.generating}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Sparkles size={20} />
                <span>{t.studio.forgeAsset}</span>
              </div>
            )}
          </NeonButton>
        </div>

        {/* Right Column: Preview & Output */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-pane rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col min-h-[600px] relative">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-[#8C4DFF] border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(140,77,255,0.3)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="text-[#8C4DFF] animate-pulse" size={32} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-[#8C4DFF] uppercase tracking-tight animate-pulse">
                      {generationStatus || t.studio.generating}
                    </h3>
                    <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em]">
                      Neural Engine Active // Do not close terminal
                    </p>
                  </div>
                  <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#8C4DFF]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 15, ease: "linear", repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <ShieldCheck className="text-red-500" size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-red-500 uppercase tracking-tight">
                      {error.includes("API key") 
                        ? t.common.errors.apiTitle 
                        : error.includes("resource-exhausted") || error.includes("credits")
                          ? t.common.errors.creditsTitle
                          : t.common.errors.general}
                    </h3>
                    <p className="text-white/60 text-sm max-w-md mx-auto">
                      {error.includes("API key") 
                        ? t.common.errors.apiDesc
                        : error.includes("resource-exhausted") || error.includes("credits")
                          ? t.common.errors.creditsDesc
                          : error}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <NeonButton variant="purple" onClick={handleGenerate}>
                      <RefreshCw size={16} /> {t.common.errors.retry}
                    </NeonButton>
                    {(error.includes("API key") || error.includes("resource-exhausted") || error.includes("credits")) && (
                      <button 
                        onClick={() => setActiveView('settings')} 
                        className="px-6 py-3 rounded-xl border border-white/10 text-white/40 font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all"
                      >
                        {t.common.errors.settings}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : generatedAsset ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col h-full"
                >
                  {/* Preview Area */}
                  <div className="flex-1 bg-black/40 relative group overflow-hidden">
                    <AnimatePresence mode="wait">
                      {showOriginal && sourceImage ? (
                        <motion.img 
                          key="original"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          src={sourceImage} 
                          alt="Original" 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <motion.div 
                          key="generated"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full"
                        >
                          {generatedAsset.type === 'image' ? (
                            <img src={generatedAsset.outputUrl} alt="Generated" className="w-full h-full object-contain" />
                          ) : (
                            <video src={generatedAsset.outputUrl} controls className="w-full h-full object-contain" />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Branding Overlays Simulation */}
                    {!showOriginal && (
                      <>
                        {useLogo && (
                          <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center">
                            <ShieldCheck className="text-[#34E0F7]" size={24} />
                          </div>
                        )}
                        
                        {useSignature && (
                          <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-mono text-white/60 uppercase tracking-widest">
                            {brand.name} // {brand.ctaLink || t.studio.visitWebsite}
                          </div>
                        )}

                        {showOverlay && overlayText && (
                          <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center shadow-2xl"
                            >
                              <p className="text-xl font-black text-white uppercase tracking-tight">{overlayText}</p>
                            </motion.div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Before/After Toggle (for Image-to-Image) */}
                    {mode.includes('image-to') && sourceImage && (
                      <div className="absolute bottom-6 left-6 flex gap-2">
                         <button 
                           onMouseDown={() => setShowOriginal(true)}
                           onMouseUp={() => setShowOriginal(false)}
                           onMouseLeave={() => setShowOriginal(false)}
                           className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase border border-white/10 hover:bg-white/20 transition-colors active:bg-[#8C4DFF]/40"
                         >
                           {t.studio.compareBefore}
                         </button>
                      </div>
                    )}
                  </div>

                  {/* Branding & Overlay Controls */}
                  <div className="p-8 border-t border-white/5 bg-white/[0.02] space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-orbitron text-white uppercase tracking-widest">{t.studio.overlayTitle}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowOverlay(!showOverlay)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                            showOverlay ? 'bg-[#8C4DFF] text-white' : 'bg-white/5 text-white/40'
                          }`}
                        >
                          {t.studio.overlayBtn}
                        </button>
                      </div>
                    </div>

                    {showOverlay && (
                      <div className="flex gap-4">
                        <input 
                          type="text"
                          value={overlayText}
                          onChange={(e) => setOverlayText(e.target.value)}
                          placeholder={t.studio.overlayPlaceholder}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#8C4DFF]"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button onClick={handleSaveToMediaLab} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                        <Save className="text-white/40 group-hover:text-[#34E0F7]" size={20} />
                        <span className="text-[10px] font-bold text-white/40 uppercase">{t.studio.mediaLab}</span>
                      </button>
                      <button onClick={handleSendToPlanner} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                        <Calendar className="text-white/40 group-hover:text-[#8C4DFF]" size={20} />
                        <span className="text-[10px] font-bold text-white/40 uppercase">{t.studio.planner}</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                        <Download className="text-white/40 group-hover:text-white" size={20} />
                        <span className="text-[10px] font-bold text-white/40 uppercase">{t.studio.download}</span>
                      </button>
                      <button onClick={() => setGeneratedAsset(null)} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                        <RefreshCw className="text-white/40 group-hover:text-white" size={20} />
                        <span className="text-[10px] font-bold text-white/40 uppercase">{t.studio.new}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Sparkles size={40} className="text-white/10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t.studio.readyToForge}</h3>
                    <p className="text-white/40 text-sm max-w-md mx-auto">
                      {t.studio.readyToForgeDesc}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {['#HighQuality', '#Cinematic', '#OnBrand', '#SocialReady'].map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/20 uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History / Recent Assets */}
          {studioAssets.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.studio.recentForged}</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                {studioAssets.slice(0, 6).map((asset: StudioGeneratedAsset) => (
                  <button 
                    key={asset.id}
                    onClick={() => setGeneratedAsset(asset)}
                    className="aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-[#8C4DFF] transition-all relative group"
                  >
                    {asset.type === 'image' ? (
                      <img src={asset.outputUrl} alt="History" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Video size={20} className="text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[#8C4DFF]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIStudio;
