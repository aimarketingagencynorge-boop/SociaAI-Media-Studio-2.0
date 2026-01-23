
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Rocket, LogIn, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import NeonButton from './NeonButton';

const LandingPage: React.FC = () => {
  const { language, setLanguage, setAuthenticated, setOnboardingStep, credits, brand, resetMission } = useStore();
  const t = translations[language];
  const [showContinueDialog, setShowContinueDialog] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut" as const
      } 
    }
  };

  const handleStartMission = () => {
    if (brand.name) {
      setShowContinueDialog(true);
    } else {
      setAuthenticated(true);
      setOnboardingStep(1);
    }
  };

  const handleContinue = () => {
    setAuthenticated(true);
    setOnboardingStep(0); // Go straight to dashboard
  };

  const handleNewMission = () => {
    resetMission();
    setAuthenticated(true);
    setOnboardingStep(1);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto bg-[#0A0A12] pb-32"
    >
      {/* MONOCHROMATIC CORNER HUD - Hidden on small mobile */}
      <div className="hidden sm:block absolute top-10 left-10 text-[9px] font-mono text-cyan-500/40 tracking-[0.4em] uppercase border-l border-cyan-500/20 pl-4 py-1">
        SYSTEM_BOOT: <span className="text-cyan-500/80">OPERATIONAL</span>
      </div>
      <div className="hidden sm:block absolute top-10 right-10 text-[9px] font-mono text-cyan-500/40 tracking-[0.4em] uppercase border-r border-cyan-500/20 pr-4 py-1 text-right">
        LINK_SAT: <span className="text-cyan-500/80">CONNECTED</span>
      </div>
      <div className="hidden sm:block absolute bottom-10 left-10 text-[9px] font-mono text-cyan-500/40 tracking-[0.4em] uppercase border-l border-cyan-500/20 pl-4 py-1">
        FUEL_CELL: <span className="text-cyan-500/80">{credits}_FC</span>
      </div>

      <div className="z-10 text-center max-w-5xl relative flex flex-col items-center w-full">
        {/* TOP BADGE - FIXED POSITIONING */}
        <motion.div variants={itemVariants} className="mb-6 md:mb-12">
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="px-4 py-1.5 rounded-full bg-[#C74CFF]/5 border border-[#C74CFF]/30 text-[#C74CFF] font-orbitron text-[8px] md:text-[9px] tracking-[0.2em] flex items-center gap-2 shadow-[0_0_15px_rgba(199,76,255,0.2)]"
          >
            <Zap size={10} fill="currentColor" />
            <span>{t.startBadge}</span>
          </motion.div>
        </motion.div>

        {/* LOGO AREA - RESPONSIVE SCALING */}
        <motion.div variants={itemVariants} className="relative mb-6 md:mb-8 w-full">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-orbitron tracking-tighter select-none py-4 md:py-6 hologram-logo flex flex-col sm:flex-row items-center justify-center sm:gap-4 leading-none">
            <span className="bg-gradient-to-r from-[#8C4DFF] via-[#34E0F7] to-[#8C4DFF] bg-clip-text text-transparent animate-gradient-x text-center">
              SociAI MediA Studio
            </span>
          </h1>
          <div className="w-32 md:w-64 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent mx-auto mt-2" />
        </motion.div>

        <motion.p 
          variants={itemVariants}
          className="text-sm md:text-xl text-white/40 font-light mb-10 md:mb-16 max-w-2xl mx-auto font-orbitron tracking-widest uppercase leading-relaxed px-4"
        >
          {t.heroSubtitle}
        </motion.p>

        {/* BUTTONS - MOBILE STACKING */}
        {!showContinueDialog ? (
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 md:gap-10 justify-center items-center w-full max-w-md sm:max-w-none">
            <div className="relative group w-full sm:w-auto">
              {/* NAVIGATION BEACON */}
              <div className="hidden md:block absolute -left-12 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#34E0F7] rounded-full nav-beacon" />
              
              <NeonButton 
                variant="purple" 
                className="w-full sm:w-auto flex items-center justify-center gap-4 md:text-xl px-10 md:px-14 py-4 md:py-6 shadow-[0_0_40px_rgba(140,77,255,0.3)] border-2"
                onClick={handleStartMission}
              >
                <Rocket size={20} className="md:size-24 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                {t.startBtn}
              </NeonButton>
            </div>
            
            <NeonButton 
              variant="cyan" 
              glow={false}
              className="w-full sm:w-auto flex items-center justify-center gap-4 md:text-xl px-10 md:px-14 py-4 md:py-6 border-2 border-opacity-30 hover:border-opacity-100 bg-white/5 backdrop-blur-md"
              onClick={() => setAuthenticated(true)}
            >
              <LogIn size={20} className="md:size-24" />
              {t.loginBtn}
            </NeonButton>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-3xl border-[#8C4DFF]/30 w-full max-w-lg space-y-6"
          >
            <div className="text-center space-y-2 mb-8">
              <p className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Wykryto aktywną misję</p>
              <h3 className="text-2xl font-black font-orbitron text-[#34E0F7]">{brand.name}</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <NeonButton 
                variant="purple" 
                className="w-full py-5 flex items-center justify-center gap-3"
                onClick={handleContinue}
              >
                <ChevronRight size={18} />
                {t.continueBtn}
              </NeonButton>
              <NeonButton 
                variant="cyan" 
                glow={false}
                className="w-full py-5 flex items-center justify-center gap-3 opacity-60 hover:opacity-100"
                onClick={handleNewMission}
              >
                <RefreshCw size={18} />
                {t.newMissionBtn}
              </NeonButton>
            </div>
          </motion.div>
        )}

        {/* LANGUAGE SELECTOR */}
        <motion.div variants={itemVariants} className="mt-12 md:mt-20 flex gap-2 md:gap-4 justify-center flex-wrap">
          {(['PL', 'EN', 'NO', 'RU'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] md:text-[11px] font-orbitron transition-all border-2 ${
                language === lang 
                  ? 'border-cyan-500 text-cyan-500 bg-cyan-500/15 shadow-[0_0_20px_rgba(52,224,247,0.3)]' 
                  : 'border-white/5 text-white/20 hover:text-white hover:border-white/20'
              }`}
            >
              {lang}
            </button>
          ))}
        </motion.div>
      </div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 md:bottom-10 w-full text-center px-4"
      >
        <p className="text-white/10 text-[8px] md:text-[10px] font-mono uppercase tracking-[0.3em] md:tracking-[0.5em] hover:text-white/40 transition-colors cursor-default">
          {t.footer} | <span className="text-[#34E0F7]/40 uppercase block sm:inline mt-2 sm:mt-0">{t.slogan}</span>
        </p>
      </motion.footer>

      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default LandingPage;
