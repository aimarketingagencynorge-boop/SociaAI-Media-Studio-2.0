import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Image as ImageIcon, Sparkles, RefreshCw, Send, History, CheckCircle2, Wand2, ArrowLeft, Save } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';
import SmartVision from './SmartVision';

const MediaLab: React.FC = () => {
  const { 
    language, 
    deductCredits, 
    brand, 
    editingPost, 
    setEditingPost, 
    updatePost, 
    setActiveView 
  } = useStore();
  
  const t = translations[language];

  const [refinePrompt, setRefinePrompt] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For visual versioning in the UI
  const [vHistory, setVHistory] = useState<any[]>([]);

  useEffect(() => {
    if (editingPost) {
      if (vHistory.length === 0 || vHistory[0].id !== editingPost.id) {
        setVHistory([editingPost]);
      }
      setEditableContent(editingPost.content);
    }
  }, [editingPost]);

  const handleRefine = async () => {
    if (!editingPost || !refinePrompt) return;
    
    if (deductCredits(5)) {
      setIsGenerating(true);
      setError(null);
      try {
        // Fixed: Added missing language argument to refineContent to satisfy the expected 4 arguments.
        const result = await gemini.refineContent(editingPost, refinePrompt, brand, language);
        const updatedPost = {
          ...editingPost,
          content: result.content,
          hook: result.hook,
          imagePrompt: result.imagePrompt,
          imagePreviewUrl: result.imagePreviewUrl
        };
        
        setEditingPost(updatedPost);
        setVHistory(prev => [...prev, updatedPost]);
        setRefinePrompt('');
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      } catch (e) {
        setError("Błąd podczas rafinacji wizji.");
      } finally {
        setIsGenerating(false);
      }
    } else {
      setError("INSUFFICIENT_ENERGY: Refuel Required (5 FC).");
    }
  };

  const handleApplyToDashboard = () => {
    if (!editingPost) return;
    updatePost(editingPost.id, {
      ...editingPost,
      content: editableContent
    });
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setActiveView('dashboard');
    }, 1000);
  };

  if (!editingPost) {
    return (
      <div className="p-8 pb-24 max-w-7xl mx-auto h-full flex flex-col items-center justify-center text-center space-y-6">
         <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/10">
            <ImageIcon size={48} />
         </div>
         <div className="space-y-2">
            <h2 className="text-2xl font-black font-orbitron text-white uppercase tracking-widest">Media Lab Empty</h2>
            <p className="text-white/40 text-xs font-orbitron uppercase tracking-widest">Wybierz post z Dashboardu, aby rozpocząć rafinację wizji.</p>
         </div>
         <NeonButton variant="cyan" onClick={() => setActiveView('dashboard')}>POWRÓT DO CENTRUM DOWODZENIA</NeonButton>
      </div>
    );
  }

  return (
    <div className="p-8 pb-24 max-w-6xl mx-auto relative h-full flex flex-col bg-[#0A0A12]">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <button 
            onClick={() => { setEditingPost(null); setActiveView('dashboard'); }}
            className="flex items-center gap-2 text-white/40 hover:text-[#34E0F7] text-[10px] font-orbitron uppercase tracking-widest mb-4 transition-colors"
          >
            <ArrowLeft size={14} /> Powrót do misji
          </button>
          <h2 className="text-4xl font-black font-orbitron mb-2 tracking-tight text-[#34E0F7]">
            SociAI <span className="text-white">Media Lab</span>
          </h2>
          <div className="flex items-center gap-4 text-[10px] font-orbitron text-white/20 uppercase tracking-widest">
             Refining Post: <span className="text-white/60">{editingPost.topic}</span>
             <span className="text-[#8C4DFF]">Cost: 5 FC / edit</span>
          </div>
        </div>
        <NeonButton 
          variant="cyan" 
          onClick={handleApplyToDashboard}
          className="hidden md:flex items-center gap-3 py-3"
        >
          <Save size={18} /> ZATWIERDŹ ZMIANY
        </NeonButton>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1">
        {/* Visual Engine Display */}
        <section className="space-y-6">
           <SmartVision 
             imageUrl={editingPost.imagePreviewUrl}
             hookText={editingPost.hook}
             isRefining={isGenerating}
             className="aspect-square md:aspect-video shadow-[0_0_60px_rgba(52,224,247,0.15)] border-2 border-white/5"
           />

           <div className="flex items-center gap-4 px-6 py-4 glass-panel rounded-2xl border-white/5">
              <History size={16} className="text-white/20" />
              <div className="flex gap-2">
                 {vHistory.map((v, i) => (
                   <button 
                    key={i} 
                    onClick={() => setEditingPost(v)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center text-[10px] font-orbitron transition-all ${editingPost === v ? 'border-[#34E0F7] bg-[#34E0F7]/10 text-white shadow-[0_0_10px_#34E0F7]' : 'border-white/5 text-white/20 hover:border-white/20'}`}
                   >
                     v{i+1}
                   </button>
                 ))}
              </div>
           </div>
        </section>

        {/* Refinement Control Pad */}
        <section className="glass-panel p-8 rounded-[2.5rem] border-white/10 flex flex-col space-y-8 relative overflow-hidden">
           <div className="space-y-4">
              <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-[0.3em]">CONTENT_SYNC (LIVE_EDIT)</label>
              <textarea 
                value={editableContent}
                onChange={e => setEditableContent(e.target.value)}
                className="w-full bg-white/5 rounded-2xl border border-white/10 p-6 font-inter text-sm leading-relaxed text-white/80 outline-none focus:border-[#8C4DFF] min-h-[150px]"
              />
           </div>

           <div className="space-y-4 flex-1">
              <label className="block text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-[0.3em]">REFINE_COMMAND_INPUT</label>
              <textarea 
                value={refinePrompt}
                onChange={e => setRefinePrompt(e.target.value)}
                placeholder="Np: Zmień napis na czerwony, dodaj logo w rogu, zrób mroczniejszy klimat..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 outline-none focus:border-[#34E0F7] transition-all text-sm font-mono placeholder:text-white/10"
              />
              <p className="text-[8px] font-mono text-white/20 uppercase">ForceCredits per iteration: 5 FC</p>
           </div>

           <div className="pt-6 border-t border-white/5 space-y-4">
              {error && <p className="text-red-500 text-[9px] font-orbitron uppercase tracking-widest text-center">{error}</p>}
              <NeonButton 
                variant="cyan" 
                className="w-full py-6 flex items-center justify-center gap-4 text-lg font-black"
                onClick={handleRefine}
                disabled={isGenerating || !refinePrompt}
              >
                {isGenerating ? <RefreshCw className="animate-spin" /> : <Wand2 size={24} />}
                REFINE VISION (5 FC)
              </NeonButton>
              <button 
                onClick={handleApplyToDashboard}
                className="md:hidden w-full py-4 text-[10px] font-orbitron text-white/40 uppercase tracking-widest border border-white/10 rounded-xl"
              >
                Zastosuj i powróć
              </button>
           </div>
        </section>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 p-4 rounded-2xl glass-panel flex items-center gap-3 z-[100] border border-[#34E0F7]/50 shadow-[0_0_30px_rgba(52,224,247,0.2)] text-[#34E0F7]"
          >
            <CheckCircle2 size={20} />
            <span className="font-orbitron text-xs uppercase tracking-wider">Mission Synchronized: Dashboard Updated</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaLab;