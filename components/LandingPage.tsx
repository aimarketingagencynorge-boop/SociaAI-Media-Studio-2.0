import { STARTER_CREDITS, WEEK_PLAN_COST, IMAGE_WITH_BRIEF_COST } from '../launchOffer';

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Rocket, LogIn, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import NeonButton from './NeonButton';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Starfield: React.FC = () => {
  const stars = Array.from({ length: 150 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5
  }));

  return (
    <div className="starfield">
      {stars.map(star => (
        <div 
          key={star.id} 
          className="star" 
          style={{ 
            top: star.top, 
            left: star.left, 
            width: `${star.size}px`, 
            height: `${star.size}px`,
            '--duration': `${star.duration}s`,
            animationDelay: `${star.delay}s`
          } as any} 
        />
      ))}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { language, setLanguage, setAuthenticated, setOnboardingStep, credits, brand, resetMission, setFirebaseUser, updateBrand, setIsStarted } = useStore();
  const t = translations[language];
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          language: language,
          onboardingStep: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch((e: any) => {
          handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`);
          throw e;
        });
        setOnboardingStep(1);
      } else {
        // Load existing user data into store
        const data = userDoc.data();
        // AI settings are now synced via workspaceId in AuthContext
        if (data.brand) updateBrand(data.brand);
        if (data.language) setLanguage(data.language);
        if (typeof data.onboardingStep === 'number') setOnboardingStep(data.onboardingStep);
      }

      setFirebaseUser(user);
      setAuthenticated(true);
      setIsStarted(true);
    } catch (error: any) {
      console.error("Login failed:", error);
      let msg = "Login failed. Please try again.";
      if (error.code === 'auth/unauthorized-domain') {
        msg = "Unauthorized domain. Please add this domain to your Firebase Console authorized domains.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        msg = "Login popup was closed. Please try again.";
      } else if (error.message?.includes('Missing or insufficient permissions')) {
        msg = "Firestore permission error. Please check your security rules.";
      }
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStartMission = () => {
    if (auth.currentUser && brand.name) {
      setShowContinueDialog(true);
    } else {
      handleLogin();
    }
  };

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
        ease: "easeOut"
      } 
    }
  };

  const handleContinue = () => {
    if (!auth.currentUser) { void handleLogin(); return; }
    setIsStarted(true);
    setAuthenticated(true);
  };

  const handleNewMission = () => {
    if (!auth.currentUser) { void handleLogin(); return; }
    setIsStarted(true);
    resetMission();
    setAuthenticated(true);
    setOnboardingStep(1);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050508] overflow-x-hidden crt-flicker">
      {/* Background Atmosphere */}
      <Starfield />
      <div className="scanline" />
      <div className="vignette" />
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto pb-32"
      >
        {/* MONOCHROMATIC CORNER HUD - Hidden on small mobile */}
        <div className="hidden sm:block absolute top-8 left-8 text-[8px] font-mono text-cyan-400/30 tracking-[0.4em] uppercase border-l border-cyan-400/10 pl-3 py-1">
          SYSTEM_BOOT: <span className="text-cyan-400/60">OPERATIONAL</span>
          <div className="mt-1 text-[7px] opacity-40">COORDS: 42.000 / 13.337</div>
        </div>
        <div className="hidden sm:block absolute top-8 right-8 text-[8px] font-mono text-cyan-400/30 tracking-[0.4em] uppercase border-r border-cyan-400/10 pr-3 py-1 text-right">
          LINK_SAT: <span className="text-cyan-400/60">CONNECTED</span>
          <div className="mt-1 text-[7px] opacity-40">SIGNAL: 98.4% STABLE</div>
        </div>
        <div className="hidden sm:block absolute bottom-8 left-8 text-[8px] font-mono text-cyan-400/30 tracking-[0.4em] uppercase border-l border-cyan-400/10 pl-3 py-1">
          FUEL_CELL: <span className="text-cyan-400/60">{credits}_FC</span>
          <div className="mt-1 text-[7px] opacity-40">CONSUMPTION: 0.04/SEC</div>
        </div>

        <div className="z-10 text-center max-w-5xl relative flex flex-col items-center w-full">
          {/* TOP BADGE - FIXED POSITIONING */}
          <motion.div variants={itemVariants} className="mb-4 md:mb-8">
            <motion.div 
              animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 font-orbitron text-[7px] md:text-[8px] tracking-[0.2em] flex items-center gap-2 shadow-[0_0_10px_rgba(34,211,238,0.1)] backdrop-blur-md"
            >
              <Zap size={8} className="text-cyan-400" />
              <span>{t.startBadge}</span>
            </motion.div>
          </motion.div>

          {/* LOGO AREA - RESPONSIVE SCALING */}
          <motion.div 
            variants={itemVariants} 
            className="relative mb-4 md:mb-6 w-full"
          >
            <div className="absolute -inset-10 bg-cyan-500/5 blur-[80px] rounded-full opacity-20" />
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-orbitron tracking-tighter select-none py-2 md:py-4 hologram-logo flex flex-col items-center justify-center leading-none relative z-10">
              <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">SociAI</span>
              <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">MediA Studio</span>
            </h1>
            <div className="w-24 md:w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent mx-auto mt-1" />
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-xs md:text-base text-white/40 font-light mb-8 md:mb-12 max-w-xl mx-auto font-orbitron tracking-[0.2em] uppercase leading-relaxed px-4"
          >
            {language === 'PL' ? 'Twoja marka. Tydzień postów. Grafiki gotowe do publikacji.' : t.heroSubtitle}
          </motion.p>


        {/* BUTTONS - MOBILE STACKING */}
        {loginError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] font-orbitron uppercase tracking-widest max-w-md text-center"
          >
            {loginError}
          </motion.div>
        )}

        {!showContinueDialog ? (
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center items-center w-full max-w-md sm:max-w-none">
            <div className="relative group w-full sm:w-auto">
              {/* NAVIGATION BEACON */}
              <div className="hidden md:block absolute -left-10 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#34E0F7] rounded-full nav-beacon opacity-40" />
              
              <NeonButton 
                variant="purple" 
                className="w-full sm:w-auto flex items-center justify-center gap-3 md:text-lg px-8 md:px-12 py-3 md:py-5 shadow-[0_0_30px_rgba(140,77,255,0.2)] border"
                disabled={isLoggingIn}
                onClick={handleStartMission}
              >
                <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                {t.startBtn}
              </NeonButton>
            </div>
            
            <NeonButton 
              variant="cyan" 
              glow={false}
              className="w-full sm:w-auto flex items-center justify-center gap-3 md:text-lg px-8 md:px-12 py-3 md:py-5 border border-opacity-20 hover:border-opacity-100 bg-white/5 backdrop-blur-md"
              onClick={handleLogin}
              disabled={isLoggingIn}
            >
              <LogIn size={18} className={`${isLoggingIn ? 'animate-spin' : ''}`} />
              {isLoggingIn ? 'Connecting...' : t.loginBtn}
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

        <div className="mt-8 w-full max-w-3xl space-y-6">
          <p className="text-sm text-slate-300">{STARTER_CREDITS} FC / 7 dni gratis po rejestracji karty · Potem 49 zł/mies.</p>
          <a href="/?workshop=1" className="inline-flex rounded-xl border border-cyan-300/40 px-6 py-3 text-cyan-200 hover:bg-cyan-300/10">Wypróbuj warsztat bez logowania →</a>
          <div className="grid md:grid-cols-3 gap-3 text-left">
            {[['01 / DNA MARKI', 'Opisz ofertę i odbiorców. Zacznij bez skanowania strony.'], ['02 / PIERWSZA MISJA', `Plan siedmiu postów za ${WEEK_PLAN_COST} FC. Edytuj hooki, treść i CTA.`], ['03 / TWOJA GRAFIKA', `Obraz z promptem zwykle ${IMAGE_WITH_BRIEF_COST} FC. Dopasuj, pobierz i opublikuj.`]].map(([title, body]) => <div key={title} className="p-5 rounded-2xl border border-white/10 bg-white/[.03]"><h2 className="text-xs tracking-widest text-cyan-300 mb-3">{title}</h2><p className="text-sm text-slate-400 leading-relaxed">{body}</p></div>)}
          </div>
          <details className="text-left border border-white/10 rounded-xl p-4 text-sm text-slate-400"><summary className="cursor-pointer text-white">Co się dzieje po wykorzystaniu kredytów?</summary><p className="mt-3">Twoje zapisane materiały pozostają dostępne do edycji i pobrania. Po 7 dniach próby abonament odnawia się automatycznie: 49 zł/mies. za 500 FC, chyba że wcześniej anulujesz. Wyczerpanie FC nie przyspiesza obciążenia karty. Niewykorzystane FC nie przechodzą na kolejny okres. Pakiet startowy otrzymujesz raz na konto i kartę, na 7 dni. W pilotażu liczba nowych pakietów dziennie jest ograniczona.</p></details>
          <a href="https://socialmediastudio.pl/" target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-slate-400 underline">Potrzebujesz pomocy z prowadzeniem marki? Social Media Studio</a>
        </div>
        {/* LANGUAGE SELECTOR */}
        <motion.div variants={itemVariants} className="mt-8 md:mt-12 flex gap-2 md:gap-3 justify-center flex-wrap">
          {(['PL', 'EN', 'NO', 'RU'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-[8px] md:text-[9px] font-orbitron transition-all border ${
                language === lang 
                  ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(52,224,247,0.2)]' 
                  : 'border-white/5 text-white/10 hover:text-white hover:border-white/10'
              }`}
            >
              {lang}
            </button>
          ))}
        </motion.div>
      </div>
    </motion.div>

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
    </div>
  );
};

export default LandingPage;
