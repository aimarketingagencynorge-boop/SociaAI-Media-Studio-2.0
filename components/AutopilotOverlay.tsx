
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Zap, Database, Share2, ShieldCheck, Map, Cpu } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

const AutopilotOverlay: React.FC = () => {
  const { language, isAutopilotRunning } = useStore();
  const t = translations[language];
  const [currentStatus, setCurrentStatus] = useState(0);

  const statuses = [
    "AUTOPILOT_ENGAGED: INITIALIZING...",
    "ŁĄCZENIE Z TRENDAMI GALAKTYCZNYMI...",
    "OBLICZANIE TRAJEKTORII ZASIĘGÓW...",
    "MAPOWANIE DNA MARKI DO TRANSMISJI...",
    "NEURAL_CORE: PISANIE TREŚCI...",
    "SYNCHRONIZACJA Z MISTRZEM YODĄ...",
    "FINALIZOWANIE PLANU MISJI..."
  ];

  useEffect(() => {
    if (isAutopilotRunning) {
      const interval = setInterval(() => {
        setCurrentStatus((prev) => (prev + 1) % statuses.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isAutopilotRunning]);

  if (!isAutopilotRunning) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#0A0A12]/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Starfield and Grid */}
      <div className="grid-overlay opacity-20" />
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-[800px] h-[800px] border border-[#34E0F7] rounded-full flex items-center justify-center"
        >
          <div className="w-[600px] h-[600px] border border-[#8C4DFF] rounded-full flex items-center justify-center">
            <div className="w-[400px] h-[400px] border border-[#C74CFF] rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center flex flex-col items-center max-w-lg px-8">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            boxShadow: ["0 0 20px #8C4DFF", "0 0 60px #34E0F7", "0 0 20px #8C4DFF"]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl bg-black border-2 border-[#34E0F7] flex items-center justify-center text-[#34E0F7] mb-8"
        >
          <Cpu size={48} className="animate-pulse" />
        </motion.div>

        <h2 className="text-3xl font-black font-orbitron mb-2 tracking-[0.3em] text-white">
          AUTOPILOT <span className="text-[#34E0F7]">ENGAGED</span>
        </h2>
        
        <div className="h-6 mb-12">
           <AnimatePresence mode="wait">
             <motion.p 
               key={currentStatus}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest"
             >
               {statuses[currentStatus]}
             </motion.p>
           </AnimatePresence>
        </div>

        {/* HUD Elements */}
        <div className="grid grid-cols-2 gap-4 w-full mb-12">
           {[
             { label: 'TREND_SYNC', icon: <Share2 size={14} />, active: true },
             { label: 'DNA_MAPPING', icon: <Database size={14} />, active: currentStatus > 2 },
             { label: 'NEURAL_GEN', icon: <Cpu size={14} />, active: currentStatus > 4 },
             { label: 'PLAN_STRAT', icon: <Map size={14} />, active: currentStatus > 5 },
           ].map((item, i) => (
             <div key={i} className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-700 ${item.active ? 'border-[#34E0F7]/40 bg-[#34E0F7]/5 text-[#34E0F7]' : 'border-white/5 text-white/10'}`}>
                {item.icon}
                <span className="text-[8px] font-orbitron tracking-widest">{item.label}</span>
             </div>
           ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
           <motion.div 
             animate={{ width: `${((currentStatus + 1) / statuses.length) * 100}%` }}
             className="h-full bg-gradient-to-r from-[#8C4DFF] to-[#34E0F7] shadow-[0_0_15px_#34E0F7]"
           />
        </div>
        
        <p className="text-[8px] font-orbitron text-white/20 uppercase tracking-[0.5em]">First Mission Plan: 0 FC BONUS</p>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * -100],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 2, 
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="w-1 h-1 bg-white/20 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default AutopilotOverlay;
