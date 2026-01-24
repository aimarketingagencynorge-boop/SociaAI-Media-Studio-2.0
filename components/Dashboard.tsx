
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
  Globe
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
        // UŻYWAMY brand.missionLanguage
        const newPosts = await gemini.generateWeeklyPlan(brand, brand.missionLanguage, 0);
        setWeeklyPlan(newPosts);
      } finally {
        setAutopilotRunning(false);
      }
    }
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
        
        // UŻYWAMY brand.missionLanguage
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
    <div className="flex h-screen bg-[#0A0A12] flex-col overflow-hidden relative">
      <AnimatePresence>{isHyperspaceActive && <Hyperspace />}</AnimatePresence>
      
      {/* MAIN AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-20 pb-40">
        {days.map((day) => {
          const dayPosts = posts.filter((p) => p.dayIndex === day.id);
          
          return (
            <section key={day.id} id={`day-${day.id}`} className="max-w-[1400px] mx-auto">
              {/* DAY HEADER HUD */}
              <div className="flex items-center gap-6 mb-10">
                <h3 className="text-3xl font-black font-orbitron tracking-[0.2em] text-white">
                  {day.name} <span className="mx-4 text-white/20 font-light">/</span> <span className="text-[#34E0F7]">{day.date}</span>
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-white/20 tracking-[0.2em] uppercase flex items-center gap-2"><Globe size={10} /> SIGNAL_LANG: {brand.missionLanguage}</span>
                  <button className="w-8 h-8 rounded-lg bg-[#34E0F7]/10 border border-[#34E0F7]/30 flex items-center justify-center text-[#34E0F7] hover:bg-[#34E0F7] hover:text-black transition-all">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* MISSION CARDS */}
              <div className="space-y-12">
                {dayPosts.map((post) => (
                  <div key={post.id} className="relative group">
                    <div className={`glass-panel rounded-[1.5rem] overflow-hidden flex flex-col lg:flex-row border-white/10 shadow-2xl transition-all duration-500 bg-black/20 ${post.isApproved ? 'ring-2 ring-[#34E0F7] border-[#34E0F7]/40 shadow-[0_0_30px_#34E0F722]' : 'hover:border-white/20'}`}>
                      
                      {/* LEFT: VISION PANEL */}
                      <div className="lg:w-[540px] relative shrink-0 aspect-square lg:aspect-auto border-r border-white/10">
                         <SmartVision 
                           imageUrl={post.imagePreviewUrl} 
                           hookText={post.hook} 
                           showHook={post.showHook}
                           isRefining={regeneratingId === post.id || transmittingId === post.id}
                           className="h-full w-full"
                         />
                         
                         {/* Control Overlays (Top Left) */}
                         <div className="absolute top-6 left-6 flex gap-2">
                            <button className="p-3 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-white border border-white/10 transition-all"><Send size={16} /></button>
                            <button onClick={() => removePost(post.id)} className="p-3 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-red-500 border border-white/10 transition-all"><Trash2 size={16} /></button>
                         </div>
                      </div>

                      {/* RIGHT: DATA PANEL */}
                      <div className="flex-1 bg-black/40 p-10 flex flex-col">
                         {/* Header Metadata */}
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-5">
                               <div className="p-3 bg-white/5 rounded-xl text-white/40 border border-white/10"><Wifi size={20}/></div>
                               <div>
                                  <h4 className="text-[14px] font-black font-orbitron text-white uppercase tracking-[0.1em]">{post.platform} CAMPAIGN</h4>
                                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-0.5">GRAND OPENING INTRO</p>
                               </div>
                            </div>
                         </div>

                         {/* Content Field */}
                         <div className="relative mb-10">
                            <textarea 
                              disabled={post.status !== 'draft'}
                              value={post.content} 
                              onChange={(e) => updatePost(post.id, { content: e.target.value })}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl p-8 text-[13px] leading-relaxed text-white/70 min-h-[160px] outline-none focus:border-[#34E0F7] font-inter custom-scrollbar shadow-inner"
                            />
                         </div>

                         {/* Action Commands Row */}
                         <div className="grid grid-cols-3 gap-4 mb-8">
                            <button 
                              onClick={() => handleRegenerate(post.id, 'text')}
                              className="group py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-[#34E0F7] hover:bg-[#34E0F7]/5 transition-all"
                            >
                               <div className="flex items-center gap-2">
                                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700 text-white/60" />
                                  <span className="text-[10px] font-orbitron font-black uppercase text-white tracking-widest">TEKST</span>
                               </div>
                               <span className="text-[8px] font-mono text-white/20 uppercase">5 FC</span>
                            </button>
                            <button 
                              onClick={() => handleRegenerate(post.id, 'vision')}
                              className="group py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-[#8C4DFF] hover:bg-[#8C4DFF]/5 transition-all"
                            >
                               <div className="flex items-center gap-2">
                                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700 text-white/60" />
                                  <span className="text-[10px] font-orbitron font-black uppercase text-white tracking-widest">WIZJA</span>
                               </div>
                               <span className="text-[8px] font-mono text-white/20 uppercase">10 FC</span>
                            </button>
                            <button 
                              onClick={() => handleRegenerate(post.id, 'system')}
                              className="group py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-[#C74CFF] hover:bg-[#C74CFF]/5 transition-all"
                            >
                               <div className="flex items-center gap-2">
                                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700 text-white/60" />
                                  <span className="text-[10px] font-orbitron font-black uppercase text-white tracking-widest">SYSTEM</span>
                               </div>
                               <span className="text-[8px] font-mono text-white/20 uppercase">15 FC</span>
                            </button>
                         </div>

                         {/* Status Control Row */}
                         <div className="grid grid-cols-3 gap-5">
                            <button 
                              onClick={() => updatePost(post.id, { showHook: !post.showHook })}
                              className={`py-4 rounded-2xl border text-[11px] font-orbitron font-black uppercase tracking-widest transition-all ${post.showHook ? 'bg-[#34E0F7]/10 border-[#34E0F7] text-[#34E0F7] shadow-[0_0_15px_#34E0F722]' : 'border-white/10 text-white/30'}`}
                            >
                               HOOK: {post.showHook ? 'AKTYWNY' : 'OFF'}
                            </button>
                            <button 
                              onClick={() => updatePost(post.id, { isApproved: !post.isApproved })}
                              className={`py-4 rounded-2xl border text-[11px] font-orbitron font-black uppercase tracking-widest transition-all ${post.isApproved ? 'bg-white/10 border-white/40 text-white' : 'border-white/10 text-white/30 hover:border-white/40'}`}
                            >
                               {post.isApproved ? 'ZATWIERDZONO' : 'ZATWIERDŹ'}
                            </button>
                            <button 
                              disabled={!post.isApproved}
                              onClick={() => handleTransmit(post)}
                              className={`py-4 rounded-2xl border text-[11px] font-orbitron font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${post.isApproved ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'border-white/5 text-white/10 cursor-not-allowed'}`}
                            >
                               <Send size={14} /> TRANSMITUJ
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
      <footer className="h-[120px] border-t border-white/10 bg-black/80 backdrop-blur-3xl px-16 flex items-center justify-between z-40 shrink-0">
         <div className="flex items-center gap-12">
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${approvedCount > 0 ? 'bg-[#34E0F7] glow-cyan shadow-[0_0_12px_#34E0F7]' : 'bg-white/20'}`} />
                  <span className="text-[13px] font-orbitron font-black text-white uppercase tracking-[0.4em]">GOTOWOŚĆ_FLOTY: {approvedCount} / 7</span>
               </div>
               <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">ALL SIGNALS GREEN. READY FOR JUMP. (LANG: {brand.missionLanguage})</p>
            </div>
         </div>

         <div className="flex flex-col items-center">
            <p className="text-[11px] font-orbitron font-black text-[#34E0F7] uppercase tracking-[0.4em] mb-3">MISSION_SYNC: OPTIMAL</p>
            <div className="w-[400px] h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min((approvedCount / 7) * 100, 100)}%` }}
                 className="h-full bg-gradient-to-r from-[#8C4DFF] via-[#34E0F7] to-[#8C4DFF] shadow-[0_0_20px_#34E0F7]"
               />
            </div>
         </div>

         <NeonButton 
           variant="cyan" 
           glow={approvedCount >= 1} 
           disabled={approvedCount < 1}
           className="px-16 py-6 flex items-center gap-5 text-base border-2"
           onClick={handleGenerateWeek}
         >
            <Rocket size={24} className={approvedCount >= 7 ? 'animate-bounce' : ''} />
            <span className="font-black tracking-[0.1em]">INITIATE GLOBAL TRANSMISSION</span>
         </NeonButton>
      </footer>
    </div>
  );
};

export default Dashboard;
