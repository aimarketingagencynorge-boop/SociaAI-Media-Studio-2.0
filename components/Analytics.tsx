
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity, Globe, Share2 } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

const Analytics: React.FC = () => {
  const { language, posts, mediaAssets, studioAssets, integrations } = useStore();
  const t = translations[language];

  const totalAssets = mediaAssets.length + studioAssets.length;
  const totalPosts = posts.length;
  const activeIntegrations = integrations.filter(i => i.isEnabled).length;

  const chartData = [45, 78, 52, 91, 64, 88, 72];

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto">
      <header className="mb-12">
        <h2 className="text-4xl font-black font-orbitron mb-2 tracking-tight text-[#C74CFF]">
          {t.analytics.title}
        </h2>
        <p className="text-white/40 uppercase tracking-widest text-[10px] font-orbitron">Kwantowa Wizualizacja Rezultatów</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Metric Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-[2rem] border-magenta/20 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <TrendingUp size={24} className="text-[#C74CFF]" />
              <span className="text-[10px] font-orbitron text-[#C74CFF] px-2 py-1 rounded bg-[#C74CFF]/10">+220%</span>
            </div>
            <p className="text-4xl font-black font-orbitron text-white mb-1">{totalPosts}</p>
            <p className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.analytics.reach}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-[#C74CFF] opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={120} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel p-8 rounded-[2rem] border-cyan/20 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <Users size={24} className="text-[#34E0F7]" />
              <span className="text-[10px] font-orbitron text-[#34E0F7] px-2 py-1 rounded bg-[#34E0F7]/10">+118%</span>
            </div>
            <p className="text-4xl font-black font-orbitron text-white mb-1">{totalAssets}</p>
            <p className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">{t.analytics.engagement}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-[#34E0F7] opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={120} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-panel p-8 rounded-[2rem] border-white/10 flex flex-col justify-center items-center text-center"
        >
          <Activity size={32} className="text-white/20 mb-4 animate-pulse" />
          <p className="text-xs font-orbitron text-white/60 mb-2 uppercase tracking-widest">Active Integrations</p>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#34E0F7] shadow-[0_0_10px_rgba(52,224,247,1)]" />
             <p className="text-[10px] font-mono text-[#34E0F7]">{activeIntegrations} Linked</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Neon 3D Chart */}
        <section className="glass-panel p-8 rounded-[2.5rem] border-white/5 h-[400px] flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="font-orbitron text-sm uppercase tracking-widest">Fluctuacja Sygnału (30D)</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#C74CFF]" />
                  <span className="text-[8px] font-orbitron text-white/40">ORGANIC</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#34E0F7]" />
                  <span className="text-[8px] font-orbitron text-white/40">AI_BOOST</span>
               </div>
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-8 relative z-10">
             {chartData.map((val, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                 <div className="relative w-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ delay: i * 0.1, duration: 1 }}
                      className="w-full bg-gradient-to-t from-[#C74CFF]/20 to-[#C74CFF] rounded-t-lg shadow-[0_0_15px_rgba(199,76,255,0.3)]"
                    />
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${val * 0.4}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                      className="absolute bottom-0 w-full bg-[#34E0F7] mix-blend-screen opacity-60 rounded-t-lg"
                    />
                 </div>
                 <span className="text-[8px] font-orbitron text-white/20">W0{i+1}</span>
               </div>
             ))}
          </div>
          
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none opacity-5">
             {[...Array(5)].map((_, i) => <div key={i} className="w-full h-[1px] bg-white" />)}
          </div>
        </section>

        {/* Case Study Card */}
        <section className="glass-panel p-8 rounded-[2.5rem] border-[#8C4DFF]/20 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C4DFF]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1 rounded-full bg-[#8C4DFF] text-white text-[9px] font-orbitron tracking-widest uppercase">Verified Mission</div>
              <h3 className="font-orbitron text-lg text-white">{t.analytics.caseStudy}</h3>
            </div>
            
            <div className="mb-8">
              <h4 className="text-3xl font-black font-orbitron text-[#34E0F7] mb-2 leading-tight">
                {t.analytics.improvement}
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Wykorzystując autorski algorytm "SociAI Master Plan" w połączeniu z kinowymi kreacjami VEO, marka DROPTREND zanotowała skokowy wzrost zaangażowania bez zwiększania nakładów na płatną reklamę.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-[10px] font-orbitron text-white/40 mb-1 uppercase tracking-widest">Targeting Accuracy</p>
                  <p className="text-xl font-orbitron text-white">99.4%</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-[10px] font-orbitron text-white/40 mb-1 uppercase tracking-widest">AI Response Rate</p>
                  <p className="text-xl font-orbitron text-white">0.4s</p>
               </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
             <div className="flex gap-2">
                <Globe size={16} className="text-white/20" />
                <Share2 size={16} className="text-white/20" />
             </div>
             <div className="text-[10px] font-orbitron text-[#8C4DFF] uppercase tracking-widest">Operational Success</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
