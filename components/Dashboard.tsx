import FirstMission from './FirstMission';
import { missionDate } from '../missionDates';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Database, 
  RefreshCw, 
  Rocket, 
  Trash2,
  MapPin,
  Phone,
  Loader2,
  Send,
  Download,
  Wifi,
  Clock,
  AlertCircle,
  Globe,
  PlusCircle,
  Instagram,
  Facebook,
  Linkedin,
  Music2
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';
import { SocialPost } from '../types';
import SmartVision from './SmartVision';
import Hyperspace from './Hyperspace';
import TextLoader from './TextLoader';

const Dashboard: React.FC = () => {
  const { 
    language, 
    brand, 
    posts, 
    setWeeklyPlan, 
    setAutopilotRunning, 
    updatePost,
    updateBrand,
    removePost,
    addPost,
    setHyperspace,
    isHyperspaceActive,
    webhookUrl,
    triggerOutboundEvent,
    setActiveView
  } = useStore();

  const t = translations[language];
  
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regeneratingType, setRegeneratingType] = useState<'text' | 'vision' | 'system' | null>(null);
  const [transmittingId, setTransmittingId] = useState<string | null>(null);
  const [platformSelectorDay, setPlatformSelectorDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const days = [
    { name: t.days.mon.toUpperCase(), id: 0, date: missionDate(0).slice(5) },
    { name: t.days.tue.toUpperCase(), id: 1, date: missionDate(1).slice(5) },
    { name: t.days.wed.toUpperCase(), id: 2, date: missionDate(2).slice(5) },
    { name: t.days.thu.toUpperCase(), id: 3, date: missionDate(3).slice(5) },
    { name: t.days.fri.toUpperCase(), id: 4, date: missionDate(4).slice(5) },
    { name: t.days.sat.toUpperCase(), id: 5, date: missionDate(5).slice(5) },
    { name: t.days.sun.toUpperCase(), id: 6, date: missionDate(6).slice(5) },
  ];

  const handleGenerateWeek = async () => {
    if (useStore.getState().isAutopilotRunning) return;
    setAutopilotRunning(true);
    setError(null);
    try {
      const newPosts = await gemini.generateWeeklyPlan(brand, brand.contentLanguage, 0);
      setWeeklyPlan([...posts, ...newPosts]);
      
      // Trigger event for each new post
      newPosts.forEach(post => {
        triggerOutboundEvent({
          eventType: 'post_created',
          platform: post.platform,
          postId: post.id,
          content: post.content,
          assetUrl: post.imagePreviewUrl,
          sourceModule: 'dashboard'
        });
      });
    } catch (err: any) {
      console.error("Weekly plan generation failed", err);
      setError(err.message || "Failed to generate weekly plan.");
    } finally {
      setAutopilotRunning(false);
    }
  };

  const handleAddManualPost = (dayId: number, platform: SocialPost['platform']) => {
    const newPost: SocialPost = {
      id: Math.random().toString(36).substr(2, 9),
      weekIndex: 0,
      dayIndex: dayId,
      plannedDate: missionDate(dayId),
      platform,
      topic: t.dashboard.newPostTopic,
      hook: t.dashboard.newPostHook,
      content: gemini.buildFinalContent(t.dashboard.newPostContent, brand),
      hashtags: [],
      status: 'draft',
      isApproved: false,
      imageBrief: t.dashboard.imageBriefDefault,
      showHook: true,
      signatureEnabled: true
    };
    addPost(newPost);
    setPlatformSelectorDay(null);

    triggerOutboundEvent({
      eventType: 'post_created',
      platform: newPost.platform,
      postId: newPost.id,
      content: newPost.content,
      sourceModule: 'dashboard'
    });
  };

  const handleRegenerate = async (postId: string, type: 'text' | 'vision' | 'system') => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    setRegeneratingId(postId);
    setRegeneratingType(type);
    setError(null);
    try {
      let updates: Partial<SocialPost> = {};
      if (type === 'text') {
        const result = await gemini.refineText(post, t.dashboard.refineTextPrompt, brand, brand.contentLanguage);
        updates = { content: result.content };
      } else if (type === 'vision') {
        const result = await gemini.refineImage(post, t.dashboard.refineImagePrompt, brand);
        updates = {
          imageBrief: result.imageBrief,
          imagePreviewUrl: result.imagePreviewUrl
        };
      } else {
        // System - full regenerate (Content, Hook, Image)
        const result = await gemini.generateSocialPost(post.topic, post.platform, brand, brand.contentLanguage);
        updates = {
          content: result.content,
          hook: result.hook,
          hashtags: result.hashtags,
          imageBrief: result.imageBrief,
          imagePreviewUrl: result.imagePreviewUrl
        };
      }
      
      updatePost(postId, updates);
      
      triggerOutboundEvent({
        eventType: 'post_updated',
        platform: post.platform,
        postId: post.id,
        content: updates.content || post.content,
        assetUrl: updates.imagePreviewUrl || post.imagePreviewUrl,
        sourceModule: 'dashboard',
        metadata: { regenerationType: type }
      });
    } catch (err: any) {
      console.error("Regeneration failed", err);
      setError(err.message || "Regeneration failed.");
    } finally {
      setRegeneratingId(null);
      setRegeneratingType(null);
    }
  };

  const syncSignature = (newBrand: Partial<typeof brand>) => {
    const updatedBrand = { ...brand, ...newBrand };
    updateBrand(newBrand);
    
    // Update all posts that have signature enabled
    posts.forEach(post => {
      if (post.signatureEnabled) {
        const newContent = gemini.buildFinalContent(post.content, updatedBrand);
        if (newContent !== post.content) {
          updatePost(post.id, { content: newContent });
          
          triggerOutboundEvent({
            eventType: 'post_updated',
            platform: post.platform,
            postId: post.id,
            content: newContent,
            sourceModule: 'dashboard',
            metadata: { updateType: 'signature_sync' }
          });
        }
      }
    });
  };

  const downloadPostText = (post: SocialPost) => {
    const text = [post.content, post.hashtags?.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')].filter(Boolean).join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${post.platform}-post.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadPostImage = async (post: SocialPost) => {
    if (!post.imagePreviewUrl) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = post.imagePreviewUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw base image
      ctx.drawImage(img, 0, 0);

      if (post.showHook && post.hook) {
        const padding = canvas.width * 0.06;
        const boxWidth = canvas.width * 0.8;
        
        // Dynamic font size based on image width - more subtle
        const fontSize = Math.floor(canvas.width * 0.038);
        ctx.font = `900 ${fontSize}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text
        const words = post.hook.toUpperCase().split(' ');
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < boxWidth - padding * 2) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        const lineHeight = fontSize * 1.3;
        const boxHeight = lines.length * lineHeight + padding * 1.2;
        const x = canvas.width / 2;
        const y = canvas.height / 2;

        // Draw subtle glassmorphism box
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        
        const radius = 20;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight, radius);
        } else {
          ctx.rect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);
        }
        ctx.fill();
        
        // Subtle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Draw text with high contrast
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        lines.forEach((line, index) => {
            ctx.fillText(line, x, y - (lines.length - 1) * lineHeight / 2 + index * lineHeight);
        });
        ctx.restore();
      }

      // Trigger download
      const link = document.createElement('a');
      const suffix = post.showHook ? 'hook' : 'clean';
      const safeTopic = post.topic.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      link.download = `${post.platform}-${safeTopic}-${suffix}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
      setError('Nie udało się pobrać grafiki. Spróbuj ponownie.');
    }
  };

  const handleTransmit = async (post: SocialPost) => {
    if (!post.isApproved || transmittingId) return;
    setTransmittingId(post.id);
    setHyperspace(true);
    
    try {
      const destinations = useStore.getState().integrations.filter(i => i.isEnabled && i.events.includes('export_to_external'));
      if (!webhookUrl && !destinations.length) throw new Error('Najpierw skonfiguruj połączenie w Integracjach albo pobierz gotowy post.');
      // Send only to destinations explicitly configured by the user.
      if (webhookUrl) {
        const delivery = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'TRANSMIT',
            brand: brand.name,
            platform: post.platform,
            content: post.content,
            imageUrl: post.imagePreviewUrl,
            lang: brand.contentLanguage
          })
        });
        if (!delivery.ok) throw new Error(`Eksport nieudany (${delivery.status}).`);
      }

      // 2. New Integration Layer
      await triggerOutboundEvent({
        eventType: 'export_to_external',
        platform: post.platform,
        postId: post.id,
        content: post.content,
        assetUrl: post.imagePreviewUrl,
        sourceModule: 'dashboard',
        metadata: {
          topic: post.topic,
          hashtags: post.hashtags,
          dayIndex: post.dayIndex
        }
      });

      const timeout = setTimeout(() => {
        updatePost(post.id, { status: 'exported', isApproved: false });
        setHyperspace(false);
        setTransmittingId(null);
      }, 2000);
      timeoutsRef.current.push(timeout);
    } catch (e: any) {
      setHyperspace(false);
      setTransmittingId(null);
      setError(e.message || t.dashboard.transmitFailed);
    }
  };

  const approvedCount = posts.filter(p => p.isApproved).length;

  if (!brand) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center glass-panel p-12 rounded-3xl">
        <RefreshCw className="w-12 h-12 text-[#C74CFF] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-orbitron uppercase text-white/40 tracking-[0.4em]">Initializing Dashboard...</h2>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-[#050508] flex-col overflow-hidden relative crt-flicker">
      <AnimatePresence>{isHyperspaceActive && <Hyperspace />}</AnimatePresence>
      <div className="scanline" />
      <div className="vignette" />
      
      {/* MAIN AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-8 md:space-y-12 pb-48">
        <FirstMission onGenerate={handleGenerateWeek} />
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1400px] mx-auto p-6 glass-panel border-red-500/20 bg-red-500/5 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black font-orbitron text-white uppercase tracking-tight">
                  {error.includes("API key") ? t.common.errors.apiTitle : t.common.errors.general}
                </h4>
                <p className="text-white/40 text-sm">
                  {error.includes("API key") 
                    ? t.common.errors.apiDesc
                    : error}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setError(null)}
                className="px-6 py-3 rounded-xl border border-white/10 text-white/40 font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all"
              >
                DISMISS
              </button>
              {error.includes("API key") && (
                <NeonButton variant="purple" onClick={() => setActiveView('settings')}>
                  {t.common.errors.settings}
                </NeonButton>
              )}
            </div>
          </motion.div>
        )}

        {days.map((day) => {
          const dayPosts = posts.filter((p) => p.dayIndex === day.id);
          
          return (
            <section key={day.id} id={`day-${day.id}`} className="max-w-[1400px] mx-auto scroll-mt-20">
              {/* DAY HEADER HUD */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                <h3 className="text-lg md:text-2xl font-black font-orbitron tracking-[0.1em] md:tracking-[0.2em] text-white whitespace-nowrap">
                  {day.name} <span className="mx-2 md:mx-3 text-white/10 font-light">/</span> <span className="text-[#34E0F7]">{day.date}</span>
                </h3>
                <div className="hidden sm:block h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto relative">
                  <span className="text-[7px] md:text-[9px] font-mono text-white/10 tracking-[0.1em] md:tracking-[0.2em] uppercase flex items-center gap-2">
                    <Globe size={8} className="shrink-0" /> {t.dashboard.signal}: {brand.contentLanguage}
                  </span>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setPlatformSelectorDay(platformSelectorDay === day.id ? null : day.id)}
                      className="group px-4 py-2 rounded-xl bg-[#34E0F7]/10 border border-[#34E0F7]/30 flex items-center gap-2 text-[#34E0F7] hover:bg-[#34E0F7] hover:text-black transition-all"
                    >
                      <Plus size={16} />
                      <span className="text-[10px] font-orbitron font-bold uppercase tracking-widest hidden md:inline">{t.dashboard.addPost}</span>
                    </button>

                    <AnimatePresence>
                      {platformSelectorDay === day.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 top-full mt-2 z-50 glass-panel p-2 min-w-[160px] border-[#34E0F7]/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                        >
                          <div className="text-[8px] font-orbitron text-white/40 uppercase tracking-widest mb-2 px-2">{t.dashboard.selectPlatform}</div>
                          <div className="grid grid-cols-1 gap-1">
                            {[
                              { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} /> },
                              { id: 'facebook', label: 'Facebook', icon: <Facebook size={14} /> },
                              { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={14} /> },
                              { id: 'tiktok', label: 'TikTok', icon: <Music2 size={14} /> }
                            ].map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleAddManualPost(day.id, p.id as SocialPost['platform'])}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#34E0F7]/20 text-white/70 hover:text-[#34E0F7] transition-all text-left"
                              >
                                <span className="shrink-0">{p.icon}</span>
                                <span className="text-[10px] font-orbitron uppercase tracking-wider">{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* MISSION CARDS */}
              <div className="space-y-6 md:space-y-8">
                {dayPosts.map((post) => (
                  <div key={post.id} className="relative group">
                    <div className={`glass-panel rounded-[1rem] md:rounded-[1.5rem] overflow-hidden flex flex-col lg:flex-row border-white/5 shadow-xl transition-all duration-500 bg-black/40 ${post.isApproved ? 'ring-1 ring-[#34E0F7]/40 border-[#34E0F7]/20 shadow-[0_0_20px_#34E0F711]' : 'hover:border-white/10'}`}>
                      
                      {/* LEFT: VISION PANEL */}
                      <div className="lg:w-[400px] xl:w-[460px] relative shrink-0 aspect-square border-b lg:border-b-0 lg:border-r border-white/5">
                          <SmartVision 
                            imageUrl={post.imagePreviewUrl} 
                            hookText={post.hook} 
                            showHook={post.showHook}
                            isRefining={(regeneratingId === post.id && (regeneratingType === 'vision' || regeneratingType === 'system')) || transmittingId === post.id}
                            status={regeneratingId === post.id && regeneratingType ? t.dashboard.genStatus[regeneratingType] : undefined}
                            className="h-full w-full"
                          />
                         
                         {/* Control Overlays (Top Left) */}
                         <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2 z-20">
                            <button 
                              onClick={() => downloadPostImage(post)}
                              title={post.showHook ? "Download with Hook" : "Download Clean Image"}
                              className="p-2 md:p-3 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-[#34E0F7] border border-white/10 transition-all shadow-lg"
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={() => updatePost(post.id, { imagePreviewUrl: undefined, imagePrompt: undefined })} 
                              title="Delete Image"
                              className="p-2 md:p-3 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-red-500 border border-white/10 transition-all shadow-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                         </div>
                      </div>

                      {/* RIGHT: DATA PANEL */}
                      <div className="flex-1 bg-black/20 p-4 md:p-6 flex flex-col">
                         {/* Header Metadata */}
                         <div className="flex items-center justify-between mb-4 md:mb-6">
                            <div className="flex items-center gap-2 md:gap-4">
                               <div className="p-1.5 md:p-2 bg-white/5 rounded-lg text-white/30 border border-white/5">
                                  {post.platform === 'instagram' && <Instagram size={14} />}
                                  {post.platform === 'facebook' && <Facebook size={14} />}
                                  {post.platform === 'linkedin' && <Linkedin size={14} />}
                                  {post.platform === 'tiktok' && <Music2 size={14} />}
                                  {!['instagram', 'facebook', 'linkedin', 'tiktok'].includes(post.platform) && <Wifi size={14} />}
                               </div>
                               <div>
                                  <h4 className="text-[10px] md:text-[12px] font-black font-orbitron text-white uppercase tracking-[0.1em]">{(post.platform || t.dashboard.social).toUpperCase()} {t.dashboard.campaign}</h4>
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                     <p className="text-[6px] md:text-[7px] font-mono text-[#34E0F7]/40 uppercase tracking-widest">
                                        {t.dashboard.targetPlatform}: {(post.platform || t.dashboard.unknown).toUpperCase()}
                                     </p>
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* Content Field */}
                         <div className="relative mb-4 md:mb-6 flex-1">
                            <AnimatePresence>
                               {regeneratingId === post.id && (regeneratingType === 'text' || regeneratingType === 'system') && (
                                 <motion.div
                                   initial={{ opacity: 0 }}
                                   animate={{ opacity: 1 }}
                                   exit={{ opacity: 0 }}
                                   className="absolute inset-0 z-20"
                                 >
                                   <TextLoader status={t.dashboard.genStatus[regeneratingType]} />
                                 </motion.div>
                               )}
                            </AnimatePresence>
                            <textarea 
                              disabled={!!regeneratingId}
                              value={post.content} 
                              onChange={(e) => updatePost(post.id, { content: e.target.value })}
                              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 md:p-6 text-[10px] md:text-[11px] leading-relaxed text-white/60 min-h-[100px] md:min-h-[120px] outline-none focus:border-[#34E0F7]/40 font-inter custom-scrollbar shadow-inner"
                            />

                            {/* Global Signature Quick Edit */}
                            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/5 space-y-2">
                               <div className="flex items-center justify-between mb-1">
                                  <span className="text-[7px] font-orbitron text-[#34E0F7]/60 uppercase tracking-widest flex items-center gap-1">
                                     <Globe size={8} /> {t.dashboard.globalSignature}
                                  </span>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-0.5">
                                     <label className="text-[6px] font-orbitron text-white/20 uppercase tracking-widest flex items-center gap-1"><MapPin size={6}/> {t.settings.addressLabel}</label>
                                     <input 
                                       type="text"
                                       value={brand.address || ''}
                                       onChange={(e) => syncSignature({ address: e.target.value })}
                                       className="w-full bg-transparent border-b border-white/5 text-[9px] text-white/40 focus:text-[#34E0F7] focus:border-[#34E0F7]/40 outline-none transition-all font-mono py-0.5"
                                     />
                                  </div>
                                  <div className="space-y-0.5">
                                     <label className="text-[6px] font-orbitron text-white/20 uppercase tracking-widest flex items-center gap-1"><Phone size={6}/> {t.settings.phoneLabel}</label>
                                     <input 
                                       type="text"
                                       value={brand.phone || ''}
                                       onChange={(e) => syncSignature({ phone: e.target.value })}
                                       className="w-full bg-transparent border-b border-white/5 text-[9px] text-white/40 focus:text-[#34E0F7] focus:border-[#34E0F7]/40 outline-none transition-all font-mono py-0.5"
                                     />
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* Action Commands Row */}
                         <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
                            {[
                              { label: t.dashboard.text, type: 'text' as const, cost: '5 FC', color: '#34E0F7' },
                              { label: t.dashboard.vision, type: 'vision' as const, cost: '30–35 FC', color: '#8C4DFF' },
                              { label: t.dashboard.system, type: 'system' as const, cost: '35–40 FC', color: '#C74CFF' }
                            ].map((btn) => (
                              <button 
                                key={btn.type}
                                onClick={() => handleRegenerate(post.id, btn.type)}
                                className="group py-3 md:py-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-0.5 hover:bg-white/10 transition-all border-opacity-30 hover:border-opacity-100"
                                style={{ borderColor: btn.color + '44' }}
                              >
                                 <div className="flex items-center gap-1.5 md:gap-2">
                                    <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-700 text-white/40" />
                                    <span className="text-[8px] md:text-[10px] font-orbitron font-black uppercase text-white tracking-widest">{btn.label}</span>
                                 </div>
                                 <span className="text-[7px] font-mono text-white/10 uppercase tracking-tighter">{btn.cost}</span>
                              </button>
                            ))}
                         </div>

                         {/* Status Control Row */}
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                            <button 
                              onClick={() => updatePost(post.id, { showHook: !post.showHook })}
                              className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[11px] font-orbitron font-black uppercase tracking-widest transition-all ${post.showHook ? 'bg-[#34E0F7]/10 border-[#34E0F7] text-[#34E0F7] shadow-[0_0_15px_#34E0F722]' : 'border-white/10 text-white/30'}`}
                            >
                               {t.dashboard.hook}: {post.showHook ? t.dashboard.on : t.dashboard.off}
                            </button>
                            <button onClick={() => downloadPostText(post)} className="px-3 py-2 rounded-xl bg-white/10 text-white text-xs">Pobierz tekst</button>
                            <button 
                              onClick={() => updatePost(post.id, { isApproved: !post.isApproved })}
                              className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[11px] font-orbitron font-black uppercase tracking-widest transition-all ${post.isApproved ? 'bg-white/10 border-white/40 text-white' : 'border-white/10 text-white/30 hover:border-white/40'}`}
                            >
                               {post.isApproved ? t.dashboard.locked : t.dashboard.lockMission}
                            </button>
                            <button 
                              disabled={!post.isApproved}
                              onClick={() => handleTransmit(post)}
                              className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[11px] font-orbitron font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 md:gap-3 ${post.isApproved ? 'bg-[#34E0F7] text-black border-[#34E0F7] shadow-[0_0_20px_#34E0F744]' : 'border-white/5 text-white/10 cursor-not-allowed'}`}
                            >
                               <Send size={14} /> Eksportuj do integracji
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* FOOTER HUD */}
      <footer className="fixed bottom-0 left-0 right-0 md:relative min-h-[80px] md:min-h-[100px] border-t border-white/5 bg-black/95 md:bg-black/90 backdrop-blur-3xl px-4 md:px-12 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between z-[55] gap-3 md:gap-0">
         <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
            <div className="flex flex-col gap-0.5 md:gap-1.5">
               <div className="flex items-center gap-2 md:gap-3">
                  <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${approvedCount > 0 ? 'bg-[#34E0F7] glow-cyan shadow-[0_0_8px_#34E0F7]' : 'bg-white/5'}`} />
                  <span className="text-[8px] md:text-[11px] font-orbitron font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">{t.dashboard.fleetReady}: {approvedCount} / 7</span>
               </div>
               <p className="text-[6px] md:text-[8px] font-mono text-white/10 uppercase tracking-[0.2em] md:tracking-[0.3em] hidden sm:block">{t.dashboard.signalsGreen}</p>
            </div>
         </div>
 
         <div className="hidden lg:flex flex-col items-center flex-1 max-w-sm mx-6">
            <p className="text-[8px] font-orbitron font-black text-[#34E0F7]/60 uppercase tracking-[0.3em] mb-1.5">{t.dashboard.syncOptimal}</p>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min((approvedCount / 7) * 100, 100)}%` }}
                 className="h-full bg-gradient-to-r from-[#8C4DFF] via-[#34E0F7] to-[#8C4DFF]"
               />
            </div>
         </div>
 
         <NeonButton 
           variant="cyan" 
           glow={approvedCount >= 1} 
           disabled={approvedCount < 1}
           className="w-full md:w-auto py-3 md:py-4 flex items-center justify-center gap-3 text-xs md:text-sm"
           onClick={handleGenerateWeek}
         >
            <Rocket size={16} className={approvedCount >= 7 ? 'animate-bounce' : ''} />
            <span className="font-black tracking-[0.05em] md:tracking-[0.1em]">{t.dashboard.initiateGlobalSync}</span>
         </NeonButton>
      </footer>
    </div>
  );
};

export default Dashboard;
