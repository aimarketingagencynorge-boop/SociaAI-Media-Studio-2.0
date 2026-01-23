
import React, { useState } from 'react';
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
  Menu,
  X,
  Power,
  ShieldCheck
} from 'lucide-react';
import { useStore, AppView } from '../store';
import { translations } from '../i18n';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, credits, activeView, setActiveView, setAuthenticated } = useStore();
  const t = translations[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(true);

  const menuItems: { id: AppView, label: string, icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'CENTRUM DOWODZENIA', icon: <LayoutDashboard size={18} /> },
    { id: 'planner', label: 'PLANER MISJI', icon: <Calendar size={18} /> },
    { id: 'ai-studio', label: 'AI STUDIO', icon: <Zap size={18} /> },
    { id: 'media-lab', label: 'MEDIA LAB', icon: <ImageIcon size={18} /> },
    { id: 'analytics', label: 'HOLOGRAFICZNA ANALITYKA', icon: <BarChart3 size={18} /> },
    { id: 'brand-kit', label: 'DNA MARKI', icon: <Dna size={18} /> },
    { id: 'store', label: 'FUEL STATION', icon: <CreditCard size={18} /> },
    { id: 'settings', label: 'USTAWIENIA', icon: <SettingsIcon size={18} /> },
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
    setTimeout(() => {
      const element = document.getElementById(`day-${dayId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <div className="flex h-screen bg-[#0A0A12] backdrop-blur-sm overflow-hidden flex-col md:flex-row relative">
      <div className="grid-overlay pointer-events-none opacity-40"></div>
      
      {/* Sidebar Cockpit (Desktop) */}
      <aside className="hidden md:flex w-80 border-r border-white/10 flex-col p-8 glass-panel relative z-50 bg-black/40">
        <div className="mb-12 py-4">
          <h1 className="text-2xl font-black font-orbitron tracking-tighter leading-tight">
            <span className="bg-gradient-to-r from-[#8C4DFF] via-[#34E0F7] to-[#8C4DFF] bg-clip-text text-transparent">
              SociAI STUDIO
            </span>
          </h1>
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
            <ShieldCheck size={10} className="text-[#34E0F7]" /> COMMAND_STATION v2.5
          </p>
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
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="ml-10 mt-2 mb-6 space-y-2 border-l border-white/5 pl-4 overflow-hidden">
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

        <div className="mt-auto space-y-8 pt-8 border-t border-white/5">
          <div className="p-6 rounded-[1.5rem] glass-panel border-2 border-[#34E0F7]/40 bg-[#34E0F7]/5 shadow-[0_0_20px_rgba(52,224,247,0.1)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-orbitron uppercase tracking-[0.3em] font-black text-white/40">RESERVE_FUEL_FC</span>
              <div className="w-3 h-3 rounded-full bg-[#34E0F7] glow-cyan shadow-[0_0_10px_#34E0F7]" />
            </div>
            <div className="text-4xl font-black font-orbitron flex items-baseline gap-3 text-white">
              {credits} <span className="text-[12px] text-white/20 font-black">FC</span>
            </div>
            <p className="text-[8px] font-mono text-white/10 mt-3 uppercase tracking-[0.2em] font-bold">TRANSMISSION_STABILITY: 100%</p>
          </div>
          <button onClick={() => setAuthenticated(false)} className="w-full flex items-center justify-center gap-4 py-5 border border-white/5 rounded-2xl text-[10px] font-orbitron text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-[0.4em] font-black">
             <Power size={16} /> CLOSE TERMINAL
          </button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-hidden bg-[#0A0A12]/50 backdrop-blur-md">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
