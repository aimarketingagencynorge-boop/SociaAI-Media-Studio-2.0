
import React, { useState, useEffect } from 'react';
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
  Wifi,
  Clock,
  AlertCircle,
  Globe,
  PlusCircle
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';
import { SocialPost } from '../types';
import SmartVision from './SmartVision';
import Hyperspace from './Hyperspace';

const Dashboard: React.FC = () => {
  const { 
    language, 
    deductCredits, 
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
    webhookUrl
  } = useStore();
  
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [transmittingId, setTransmittingId] = useState<string | null>(null);

  const days = [
    { name: 'PONIEDZIAŁEK', id: 0, date: '11.11' },
    { name: 'WTOREK', id: 1, date: '12.11' },
    { name: 'ŚRODA', id: 2, date: '13.11' },
    { name: 'CZWARTEK', id: 3, date: '14.11' },
    { name: 'PIĄTEK', id: 4, date: '15.11' },
    { name: 'SOBOTA', id: 5, date: '16.11' },
    { name: 'NIEDZIELA', id: 6, date: '17.11' },
  ];

  const handleGenerateWeek = async () => {
    if (deductCredits(50)) {
      setAutopilotRunning(true);
      try {
        const newPosts = await gemini.generateWeeklyPlan(brand, brand.missionLanguage, 0);
        setWeeklyPlan(newPosts);
      } finally {
        setAutopilotRunning(false);
      }
    }
  };

  const handleAddManualPost = (dayId: number) => {
    const newPost: SocialPost = {
      id: Math.random().toString(36).substr(2, 9),
      weekIndex: 0,
      dayIndex: dayId,
      platform: 'instagram',
      topic: 'Nowy post operacyjny',
      hook: 'NOWY TRANSMIT',
      content: 'Zredaguj treść tutaj...',
      hashtags: [],
      status: 'draft',
      isApproved: false,
      imageBrief: 'Atmospheric scene in line with brand kit',
      showHook: true
    };
    addPost(newPost);
  };

  const handleRegenerate = async (postId: string, type: 'text' | 'vision' | 'system') => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const costs = { text: 5, vision: 10, system: 15 };
    if (deductCredits(costs[type])) {
      setRegeneratingId(postId);
      try {
        const refinePrompt = type === 'text' ? "Zmień tylko treść tekstu, zachowaj mood" : 
                           type === 'vision' ? "Zmień tylko wizualne aspekty obrazu" : 
                           "Przebuduj cały post od zera";
        
        const result = await gemini.refineContent(post, refinePrompt, brand, brand.missionLanguage);
        
        updatePost(postId, {
          content: type !== 'vision' ? result.content : post.content,
          hook: type !== 'vision' ? result.hook : post.hook,
          imagePreviewUrl: type !== 'text' ? result.imagePreviewUrl : post.imagePreviewUrl
        });
      } finally {
        setRegeneratingId(null);
      }
    }
  };

  const handleTransmit = async (post: SocialPost) => {
    if (!post.isApproved) return;
    setTransmittingId(post.id);
    setHyperspace(true);
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'TRANSMIT',
          brand: brand.name,
          platform: post.platform,
          content: post.content,
          imageUrl: post.imagePreviewUrl,
          lang: brand.missionLanguage
        })
      });

      setTimeout(() => {
        updatePost(post.id, { status: 'scheduled', isApproved: false });
        setHyperspace(false);
        setTransmittingId(null);
      }, 2000);
    } catch (e) {
      setHyperspace(false);
      setTransmittingId(null);
      alert("SIGNAL_LOST: Transmisja nieudana.");
    }
  };

  const approvedCount = posts.filter(p => p.isApproved).length;

  return (
    <div className="flex h-full bg-[#0A0A12] flex-col overflow-hidden relative">
      <AnimatePresence>{isHyperspaceActive && <Hyperspace />}</AnimatePresence>
      
      {/* MAIN AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 space-y-12 md:space-y-20 pb-48">
        {days.map((day) => {
          const dayPosts = posts.filter((p) => p.dayIndex === day.id);
          
          return (
            <section key={day.id} id={`day-${day.id}`} className="max-w-[1400px] mx-auto">
              {/* DAY HEADER HUD */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
                <h3 className="text-xl md:text-3xl font-black font-orbitron tracking-[0.1em] md:tracking-[0.2em] text-white whitespace-nowrap">
                  {day.name} <span className="mx-2 md:mx-4 text-white/20 font-light">/</span> <span className="text-[#34E0F7]">{day.date}</span>
                </h3>
                <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <span className="text-[8px] md:text-[10px] font-mono text-white/20 tracking-[0.1em] md:tracking-[0.2em] uppercase flex items-center gap-2">
                    <Globe size={10} className="shrink-0" /> SIGNAL: {brand.missionLanguage}
                  </span>
                  <button 
                    onClick={() => handleAddManualPost(day.id)}
                    className="group px-4 py-2 rounded-xl bg-[#34E0F7]/10 border border-[#34E0F7]/30 flex items-center gap-2 text-[#34E0F7] hover:bg-[#34E0F7] hover:text-black transition-all"
                  >
                    <Plus size={16} />
                    <span className="text-[10px] font-orbitron font-bold uppercase tracking-widest hidden md:inline">Dodaj Post</span>
                  </button>
                </div>
              </div>

              {/* MISSION CARDS */}
              <div className="space-y-8 md:space-y-12">
                {dayPosts.map((post) => (
                  <div key={post.id} className="relative group">
                    <div className={`glass-panel rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col lg:flex-row border-white/10 shadow-2xl transition-all duration-500 bg-black/20 ${post.isApproved ? 'ring-2 ring-[#34E0F7] border-[#34E0F7]/40 shadow-[0_0_30px_#34E0F722]' : 'hover:border-white/20'}`}>
                      
                      {/* LEFT: VISION PANEL */}
                      <div className="lg:w-[480px] xl:w-[540px] relative shrink-0 aspect-square border-b lg:border-b-0 lg:border-r border-white/10">
                         <SmartVision 
                           imageUrl={post.imagePreviewUrl} 
                           hookText={post.hook} 
                           showHook={post.showHook}
                           isRefining={regeneratingId === post.id || transmittingId === post.id}
                           className="h-full w-full"
                         />
                         
                         {/* Control Overlays (Top Left) */}
                         <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2 z-20">
                            <button className="p-2 md:p-3 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-white border border-white/10 transition-all shadow-lg"><Send size={14} /></button>
                            <button onClick={() => removePost(post.id)} className="p-2 md:p-3 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-red-500 border border-white/10 transition-all shadow-lg"><Trash2 size={14} /></button>
                         </div>
                      </div>

                      {/* RIGHT: DATA PANEL */}
                      <div className="flex-1 bg-black/40 p-6 md:p-10 flex flex-col">
                         {/* Header Metadata */}
                         <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div className="flex items-center gap-3 md:gap-5">
                               <div className="p-2 md:p-3 bg-white/5 rounded-xl text-white/40 border border-white/10"><Wifi size={16}/></div>
                               <div>
                                  <h4 className="text-[11px] md:text-[14px] font-black font-orbitron text-white uppercase tracking-[0.1em]">{post.platform} CAMPAIGN</h4>
                                  <p className="text-[8px] md:text-[9px] font-mono text-white/20 uppercase tracking-widest mt-0.5">MISSION_OBJECTIVE: ENGAGEMENT</p>
                               </div>
                            </div>
                         </div>

                         {/* Content Field */}
                         <div className="relative mb-6 md:mb-10 flex-1">
                            <textarea 
                              disabled={post.status !== 'draft'}
                              value={post.content} 
                              onChange={(e) => updatePost(post.id, { content: e.target.value })}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 md:p-8 text-[12px] md:text-[13px] leading-relaxed text-white/70 min-h-[140px] md:min-h-[160px] outline-none focus:border-[#34E0F7] font-inter custom-scrollbar shadow-inner"
                            />
                         </div>

                         {/* Action Commands Row */}
                         <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                            {[
                              { label: 'TEKST', type: 'text' as const, cost: '5 FC', color: '#34E0F7' },
                              { label: 'WIZJA', type: 'vision' as const, cost: '10 FC', color: '#8C4DFF' },
                              { label: 'SYSTEM', type: 'system' as const, cost: '15 FC', color: '#C74CFF' }
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
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
                            <button 
                              onClick={() => updatePost(post.id, { showHook: !post.showHook })}
                              className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[11px] font-orbitron font-black uppercase tracking-widest transition-all ${post.showHook ? 'bg-[#34E0F7]/10 border-[#34E0F7] text-[#34E0F7] shadow-[0_0_15px_#34E0F722]' : 'border-white/10 text-white/30'}`}
                            >
                               HOOK: {post.showHook ? 'ON' : 'OFF'}
                            </button>
                            <button 
                              onClick={() => updatePost(post.id, { isApproved: !post.isApproved })}
                              className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[11px] font-orbitron font-black uppercase tracking-widest transition-all ${post.isApproved ? 'bg-white/10 border-white/40 text-white' : 'border-white/10 text-white/30 hover:border-white/40'}`}
                            >
                               {post.isApproved ? 'LOCKED' : 'LOCK MISSION'}
                            </button>
                            <button 
                              disabled={!post.isApproved}
                              onClick={() => handleTransmit(post)}
                              className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[11px] font-orbitron font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 md:gap-3 ${post.isApproved ? 'bg-[#34E0F7] text-black border-[#34E0F7] shadow-[0_0_20px_#34E0F744]' : 'border-white/5 text-white/10 cursor-not-allowed'}`}
                            >
                               <Send size={14} /> TRANSMIT
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
      <footer className="fixed bottom-0 left-0 right-0 md:relative min-h-[100px] md:min-h-[140px] border-t border-white/10 bg-black/90 md:bg-black/80 backdrop-blur-3xl px-6 md:px-16 py-4 md:py-0 flex flex-col md:flex-row items-center justify-between z-[55] gap-4 md:gap-0">
         <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto">
            <div className="flex flex-col gap-1 md:gap-3">
               <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${approvedCount > 0 ? 'bg-[#34E0F7] glow-cyan shadow-[0_0_12px_#34E0F7]' : 'bg-white/10'}`} />
                  <span className="text-[10px] md:text-[13px] font-orbitron font-black text-white uppercase tracking-[0.2em] md:tracking-[0.4em]">FLEET_READY: {approvedCount} / 7</span>
               </div>
               <p className="text-[7px] md:text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] md:tracking-[0.3em] hidden sm:block">SIGNALS_GREEN. READY_FOR_JUMP. (PL)</p>
            </div>
         </div>

         <div className="hidden lg:flex flex-col items-center flex-1 max-w-md mx-8">
            <p className="text-[10px] font-orbitron font-black text-[#34E0F7] uppercase tracking-[0.3em] mb-2">SYNC_OPTIMAL</p>
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
           className="w-full md:w-auto py-4 md:py-6 flex items-center justify-center gap-4 text-sm md:text-base"
           onClick={handleGenerateWeek}
         >
            <Rocket size={20} className={approvedCount >= 7 ? 'animate-bounce' : ''} />
            <span className="font-black tracking-[0.05em] md:tracking-[0.1em]">INITIATE_GLOBAL_SYNC</span>
         </NeonButton>
      </footer>
    </div>
  );
};

export default Dashboard;
