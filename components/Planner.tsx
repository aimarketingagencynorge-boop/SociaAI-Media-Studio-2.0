
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Filter, LayoutGrid, ChevronLeft, ChevronRight, Pin, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

const Planner: React.FC = () => {
  const { language, posts, setActiveView } = useStore();
  const t = translations[language];
  const [view, setView] = useState<'month' | 'week'>('month');

  // Kalendarz symuluje listopad (posts dayIndex 0-6 to 11.11 - 17.11)
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  const getPostsForDay = (dayNum: number) => {
    // Nasza "Misja Tygodnia" zaczyna się od 11 listopada (poniedziałek)
    const missionStartDay = 11;
    const missionEndDay = 17;
    
    if (dayNum >= missionStartDay && dayNum <= missionEndDay) {
      const dayIndex = dayNum - missionStartDay;
      return posts.filter(p => p.dayIndex === dayIndex);
    }
    return [];
  };

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-4xl font-black font-orbitron mb-2 tracking-tight text-white">
            {t.planner.title}
          </h2>
          <p className="text-white/40 uppercase tracking-widest text-[10px] font-orbitron">Temporalny Zarządca Emisji Satelitarnej</p>
        </motion.div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setView('month')}
            className={`px-6 py-2 rounded-lg text-xs font-orbitron transition-all ${view === 'month' ? 'bg-[#34E0F7] text-black' : 'text-white/40 hover:text-white'}`}
          >
            {t.planner.month}
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-6 py-2 rounded-lg text-xs font-orbitron transition-all ${view === 'week' ? 'bg-[#34E0F7] text-black' : 'text-white/40 hover:text-white'}`}
          >
            {t.planner.week}
          </button>
        </div>
      </header>

      <div className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
              <span className="font-orbitron text-sm tracking-widest uppercase">Listopad 2024</span>
              <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                <ChevronRight size={20} />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-7 border-b border-white/5 text-center py-4 bg-white/[0.01]">
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(d => (
            <div key={d} className="text-[10px] font-orbitron text-white/20 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1">
          {days.map(day => {
            const dayPosts = getPostsForDay(day);
            
            return (
              <div 
                key={day} 
                className={`min-h-[140px] border-r border-b border-white/5 p-3 group hover:bg-white/[0.02] transition-colors relative ${dayPosts.length > 0 ? 'bg-[#34E0F7]/5' : ''}`}
              >
                <span className={`text-[10px] font-orbitron transition-colors ${dayPosts.length > 0 ? 'text-[#34E0F7] font-black' : 'text-white/10 group-hover:text-white'}`}>
                  {day}
                </span>
                
                <div className="mt-2 space-y-2">
                  {dayPosts.map(post => (
                    <motion.div 
                      key={post.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => setActiveView('dashboard')}
                      className={`p-2 rounded-lg border cursor-pointer transition-all ${
                        post.status === 'scheduled' 
                          ? 'bg-[#34E0F7]/10 border-[#34E0F7]/40 shadow-[0_0_10px_#34E0F722]' 
                          : post.status === 'sent'
                            ? 'bg-green-500/10 border-green-500/40'
                            : 'bg-white/5 border-white/10 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[7px] font-orbitron uppercase ${post.status === 'scheduled' ? 'text-[#34E0F7]' : 'text-white/40'}`}>
                          {post.platform}
                        </span>
                        {post.status === 'scheduled' ? (
                          <Clock size={8} className="text-[#34E0F7] animate-pulse" />
                        ) : post.status === 'sent' ? (
                          <CheckCircle2 size={8} className="text-green-500" />
                        ) : (
                          <Pin size={8} className="text-white/20" />
                        )}
                      </div>
                      <p className={`text-[8px] line-clamp-2 leading-tight ${post.status === 'scheduled' ? 'text-white' : 'text-white/40'}`}>
                        {post.hook || post.topic}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex gap-6">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#34E0F7] glow-cyan shadow-[0_0_10px_#34E0F7]" />
            <span className="text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-widest">Zaplanowano (Satelita)</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-orbitron text-green-500/60 uppercase tracking-widest">Wysłano</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Szkic</span>
         </div>
      </div>
    </div>
  );
};

export default Planner;
