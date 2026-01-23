
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Send, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, MapPin, Phone, Globe } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import NeonButton from './NeonButton';
import Hyperspace from './Hyperspace';
import SmartVision from './SmartVision';

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

const AIStudio: React.FC = () => {
  const { language, brand, deductCredits, setHyperspace, isHyperspaceActive } = useStore();
  const t = translations[language];

  const [platform, setPlatform] = useState('Instagram');
  const [topic, setTopic] = useState('');
  const [yodaMode, setYodaMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ content: string; hook: string; hashtags: string[]; imagePreviewUrl: string; } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [progress, setProgress] = useState(0);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 5, 95)), 100);
    
    try {
      const brandContext = { ...brand, isYodaMode: yodaMode };
      const data = await gemini.generateSocialPost(topic, platform, brandContext, language);
      setResult(data);
    } catch (e) {
      showToast("Błąd połączenia z Neural Core.", "error");
    } finally {
      clearInterval(interval);
      setProgress(100);
      setIsGenerating(false);
    }
  };

  const handleTransmit = async () => {
    if (!result) return;
    if (deductCredits(10)) {
      setHyperspace(true);
      setTimeout(async () => {
        try {
          const payload = {
            brand: brand.name,
            platform,
            content: result.content,
            imageUrl: result.imagePreviewUrl,
            lang: language
          };
          // Simplified transmit for demonstration
          setHyperspace(false);
          showToast(t.studio.success, "success");
          setResult(null);
        } catch (e) {
          setHyperspace(false);
          showToast("Transmisja przerwana.", "error");
        }
      }, 2000);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-32">
      <AnimatePresence>{isHyperspaceActive && <Hyperspace />}</AnimatePresence>
      <header className="mb-10">
        <h2 className="text-4xl font-black font-orbitron mb-2 tracking-tight text-[#8C4DFF]">
          AI Studio <span className="text-white">Transmitter</span>
        </h2>
        <div className="flex items-center gap-4 text-[10px] font-orbitron text-white/40 uppercase tracking-widest">
           <span>{t.studio.costMsg}</span>
           <div className="h-px flex-1 bg-white/5" />
           <span className="text-[#34E0F7]">Target Lang: {language}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="glass-panel p-8 rounded-3xl border-white/5 space-y-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.studio.platform}</label>
            <div className="flex flex-wrap gap-2">
              {['Instagram', 'Facebook', 'LinkedIn', 'TikTok'].map(p => (
                <button key={p} onClick={() => setPlatform(p)} className={`px-6 py-2 rounded-xl border text-[10px] font-orbitron transition-all ${platform === p ? 'bg-[#34E0F7]/20 border-[#34E0F7] text-[#34E0F7]' : 'border-white/10 text-white/40 hover:border-white/20'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.studio.topic}</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[150px] outline-none focus:border-[#8C4DFF] text-sm" />
          </div>
          {language === 'PL' && (
            <div className="flex items-center justify-between p-6 bg-[#C74CFF]/5 border border-[#C74CFF]/20 rounded-2xl cursor-pointer" onClick={() => setYodaMode(!yodaMode)}>
              <div className="flex items-center gap-4">
                <YodaIcon active={yodaMode} />
                <span className={`text-xs font-orbitron uppercase tracking-widest ${yodaMode ? 'text-[#C74CFF]' : 'text-white/40'}`}>{t.studio.yodaToggle}</span>
              </div>
            </div>
          )}
          <NeonButton variant="purple" className="w-full py-6 text-lg font-black" onClick={handleGenerate} disabled={isGenerating || !topic}>{isGenerating ? `GEN... ${progress}%` : t.studio.generate}</NeonButton>
        </section>

        <section className="flex flex-col">
          {result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1">
               <div className="glass-panel rounded-[2.5rem] border-[#34E0F7]/20 overflow-hidden flex flex-col shadow-2xl">
                  <SmartVision imageUrl={result.imagePreviewUrl} hookText={result.hook} className="h-64 rounded-none" />
                  <div className="p-8 space-y-6">
                     <div className="text-sm leading-relaxed text-white/80 italic">{result.content}</div>
                  </div>
               </div>
               <div className="mt-8 flex gap-4">
                  <NeonButton variant="cyan" className="flex-1 py-5 text-sm font-black" onClick={handleTransmit}>{t.studio.transmit}</NeonButton>
               </div>
            </motion.div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border-white/5 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4 flex-1 h-full">
              <Send size={40} className="text-white/10" />
              <p className="text-white/20 font-orbitron text-xs tracking-widest uppercase">Targeting Lang: {language}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AIStudio;
