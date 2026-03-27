
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Zap, 
  ImageIcon, 
  CreditCard, 
  Settings as SettingsIcon,
  ChevronDown,
  BarChart3,
  Dna,
  Activity,
  Menu,
  X,
  Power,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useStore, AppView } from '../store';
import { useAuth } from '../AuthContext';
import { translations } from '../i18n';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, credits, activeView, setActiveView, aiSettings, isLoadingAICredits } = useStore();
  const { user, logout } = useAuth();
  const t = translations[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(true);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const menuItems: { id: AppView, label: string, icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: <LayoutDashboard size={18} /> },
    { id: 'planner', label: t.nav.planner, icon: <Calendar size={18} /> },
    { id: 'ai-studio', label: t.nav.studio, icon: <Zap size={18} /> },
    { id: 'media-lab', label: t.nav.lab, icon: <ImageIcon size={18} /> },
    { id: 'analytics', label: t.nav.analytics, icon: <BarChart3 size={18} /> },
    { id: 'brand-kit', label: t.nav.brandKit, icon: <Dna size={18} /> },
    { id: 'integrations', label: t.nav.integrations, icon: <Activity size={18} /> },
    { id: 'store', label: t.nav.store, icon: <CreditCard size={18} /> },
    { id: 'settings', label: t.nav.settings, icon: <SettingsIcon size={18} /> },
  ];

  const missionDays = [
    { id: 0, label: 'PONIEDZIAŁEK' },
    { id: 1, label: 'WTOREK' },
    { id: 2, label: 'ŚRODA' },
    { id: 3, label: 'CZWARTEK' },
    { id: 4, label: 'PIĄTEK' },
    { id: 5, label: 'SOBOTA' },
    { id: 6, label: 'NIEDZIELA' },
  ];

  const scrollToDay = (dayId: number) => {
    if (activeView !== 'dashboard') setActiveView('dashboard');
    setIsMobileMenuOpen(false);
    const timeout = setTimeout(() => {
      const element = document.getElementById(`day-${dayId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
    timeoutsRef.current.push(timeout);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="mb-8 md:mb-12 py-4">
        <h1 className="text-xl md:text-2xl font-black font-orbitron tracking-tighter leading-tight">
          <span className="bg-gradient-to-r from-[#8C4DFF] via-[#34E0F7] to-[#8C4DFF] bg-clip-text text-transparent">
            SociAI STUDIO
          </span>
        </h1>
        <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
          <ShieldCheck size={10} className="text-[#34E0F7]" /> COMMAND_STATION v2.5
        </p>
        {user && (
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8C4DFF] to-[#34E0F7] flex items-center justify-center text-[10px] font-black text-white">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-orbitron text-white uppercase truncate">{user.displayName || 'Commander'}</p>
                <p className="text-[8px] font-mono text-white/20 truncate">{user.email}</p>
              </div>
            </div>
            
            {/* AI Credits Balance */}
            <div 
              onClick={() => setActiveView('store')}
              className="p-3 bg-gradient-to-r from-[#8C4DFF]/10 to-[#34E0F7]/10 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-[#34E0F7] group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-mono text-white/60 uppercase tracking-wider">AI FUEL</span>
              </div>
              <div className="flex items-center gap-1">
                {isLoadingAICredits ? (
                  <div className="w-8 h-3 bg-white/10 animate-pulse rounded" />
                ) : (
                  <span className="text-[11px] font-orbitron font-bold text-white">
                    {aiSettings?.creditBalance || 0}
                  </span>
                )}
                <span className="text-[8px] font-mono text-white/30">CR</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  setActiveView(item.id);
                  if (item.id === 'dashboard') setIsDayMenuOpen(!isDayMenuOpen);
                  if (item.id !== 'dashboard') setIsMobileMenuOpen(false);
                }}
                className={`w-full group relative flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 border border-transparent ${
                  isActive 
                  ? 'bg-[#34E0F7]/10 text-[#34E0F7] border-[#34E0F7]/40 shadow-[0_0_20px_rgba(52,224,247,0.1)]' 
                  : 'text-white/30 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`${isActive ? 'text-[#34E0F7]' : 'text-white/20'}`}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-orbitron uppercase tracking-[0.2em] font-black">{item.label}</span>
                {item.id === 'dashboard' && (
                  <ChevronDown size={14} className={`ml-auto transition-transform ${isDayMenuOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {item.id === 'dashboard' && isDayMenuOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="ml-10 mt-2 mb-4 space-y-1 border-l border-white/5 pl-4 overflow-hidden">
                  {missionDays.map(day => (
                    <button 
                      key={day.id}
                      onClick={() => scrollToDay(day.id)}
                      className="w-full text-left py-2 px-3 text-[9px] font-orbitron text-white/20 hover:text-[#34E0F7] transition-all uppercase tracking-widest font-bold"
                    >
                      {day.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto space-y-6 pt-6 border-t border-white/5">
        <div className="p-4 rounded-2xl glass-panel border border-[#34E0F7]/20 bg-[#34E0F7]/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-orbitron uppercase tracking-[0.3em] font-black text-white/40">FUEL_FC</span>
            <div className="w-2 h-2 rounded-full bg-[#34E0F7] shadow-[0_0_8px_#34E0F7]" />
          </div>
          <div className="text-2xl font-black font-orbitron flex items-baseline gap-2 text-white">
            {credits} <span className="text-[10px] text-white/20">FC</span>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center justify-center gap-3 py-4 border border-white/5 rounded-xl text-[9px] font-orbitron text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-[0.3em] font-black">
           <Power size={14} /> EXIT_TERMINAL
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0A0A12] backdrop-blur-sm overflow-hidden flex-col md:flex-row relative">
      <div className="grid-overlay pointer-events-none opacity-40"></div>
      
      {/* Mobile Top Header */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 border-b border-white/10 glass-panel bg-black/60 z-[60]">
        <h1 className="text-lg font-black font-orbitron tracking-tighter bg-gradient-to-r from-[#8C4DFF] to-[#34E0F7] bg-clip-text text-transparent">
          SociAI STUDIO
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#34E0F7] hover:bg-white/5 rounded-lg transition-all"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] md:hidden bg-black/95 backdrop-blur-xl p-8"
          >
            <NavContent />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sidebar Cockpit (Desktop) */}
      <aside className="hidden md:flex w-80 border-r border-white/10 flex-col p-8 glass-panel relative z-50 bg-black/40">
        <NavContent />
      </aside>

      <main className="flex-1 relative overflow-hidden bg-[#0A0A12]/50 backdrop-blur-md">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
