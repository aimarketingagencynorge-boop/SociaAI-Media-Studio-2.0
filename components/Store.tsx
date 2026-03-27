
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, ZapOff, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import NeonButton from './NeonButton';

const Store: React.FC = () => {
  const { language } = useStore();
  const t = translations[language];

  const packs = [
    { id: '100', amount: 100, price: '49 PLN', color: '#34E0F7', desc: 'Sygnał Recon' },
    { id: '500', amount: 500, price: '199 PLN', color: '#8C4DFF', desc: 'Misja Floty', best: true },
    { id: '1200', amount: 1200, price: '399 PLN', color: '#C74CFF', desc: 'Imperium AI' },
  ];

  const handleBuy = (amount: number) => {
    // Stripe Mock logic as requested
    console.log(`Initializing Stripe Checkout for ${amount} FC...`);
    // In a real app we would call Stripe here. For now, let's just fuel up!
    // addCredits(amount); // Removed: backend handles credits
    alert(`Zasilanie zakończone! +${amount} ForceCredits dodane do Twojego portfela.`);
  };

  return (
    <div className="p-8 pb-24 max-w-6xl mx-auto">
      <header className="text-center mb-16 mt-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="text-5xl font-black font-orbitron mb-4 tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            {t.store.title}
          </h2>
          <p className="text-white/40 font-orbitron text-xs tracking-[0.3em] uppercase">{t.store.subtitle}</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packs.map((pack, idx) => (
          <motion.div
            key={pack.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-panel p-8 rounded-[2.5rem] relative group border-white/5 hover:border-[${pack.color}]/40 transition-all duration-500 overflow-hidden flex flex-col`}
            style={{ borderColor: pack.best ? `${pack.color}44` : '' }}
          >
            {pack.best && (
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-[#8C4DFF] text-white text-[9px] font-orbitron uppercase tracking-widest animate-pulse">
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <p className="text-[10px] font-orbitron text-white/30 uppercase tracking-[0.3em] mb-2">{pack.desc}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black font-orbitron text-white tracking-tighter">{pack.amount}</span>
                <span className="text-sm font-orbitron text-white/40">FC</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-10">
              <div className="flex items-center gap-3 text-white/60 text-xs">
                <Zap size={14} className="text-[#34E0F7]" /> Instant Deployment
              </div>
              <div className="flex items-center gap-3 text-white/60 text-xs">
                <ShieldCheck size={14} className="text-[#34E0F7]" /> Secure Transmission
              </div>
              <div className="flex items-center gap-3 text-white/60 text-xs">
                <Sparkles size={14} className="text-[#34E0F7]" /> Neural Support 24/7
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-2xl font-orbitron text-center mb-2">{pack.price}</div>
              <NeonButton 
                variant={pack.id === '100' ? 'cyan' : pack.id === '500' ? 'purple' : 'magenta'}
                className="w-full py-5"
                onClick={() => handleBuy(pack.amount)}
              >
                {t.store.buy}
              </NeonButton>
            </div>

            {/* Background Glow Overlay */}
            <div 
              className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity"
              style={{ backgroundColor: pack.color }}
            />
          </motion.div>
        ))}
      </div>

      <footer className="mt-24 glass-panel p-8 rounded-3xl border-white/5 text-center flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#34E0F7]" />
          <p className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Wszystkie płatności są szyfrowane kwantowo przez Stripe.</p>
        </div>
        <div className="text-[9px] font-orbitron text-white/20 uppercase tracking-[0.3em]">
          Usetheforce.ai Ecosystem v2.5.0
        </div>
      </footer>
    </div>
  );
};

export default Store;
