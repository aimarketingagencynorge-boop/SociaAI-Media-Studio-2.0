
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  imageUrl?: string;
  hookText?: string;
  showHook?: boolean;
  className?: string;
  isRefining?: boolean;
}

const SmartVision: React.FC<Props> = ({ imageUrl, hookText, showHook = true, className = "", isRefining = false }) => {
  return (
    <div className={`relative overflow-hidden bg-[#0A0A12] group border border-white/5 shadow-2xl ${className}`}>
      {/* Background Image - Clean Render */}
      {imageUrl ? (
        <motion.img
          key={imageUrl}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: isRefining ? 0.3 : 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          src={imageUrl}
          alt="Clean Scene Brief Render"
          className={`w-full h-full object-cover transition-transform duration-[4s] ease-out ${!isRefining && 'group-hover:scale-110'}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/5 space-y-6">
           <div className="w-24 h-24 border-2 border-white/5 rounded-[2rem] flex items-center justify-center shadow-inner">
              <span className="text-6xl font-black font-orbitron opacity-10">?</span>
           </div>
           <div className="text-center">
              <p className="text-[11px] font-orbitron uppercase tracking-[0.5em] opacity-40 mb-1">Vision_Buffer_Empty</p>
              <p className="text-[8px] font-mono opacity-20 uppercase tracking-widest">Awaiting Neural Reconfiguration</p>
           </div>
        </div>
      )}

      {/* Cinematic High-Contrast Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/40 pointer-events-none" />
      
      {/* The Hook Overlay - Branded Font & High Visibility Glassmorphism */}
      {showHook && hookText && !isRefining && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            key={hookText}
            className="px-10 py-6 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-[95%] relative overflow-hidden"
          >
            {/* Glossy Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <span className="relative z-10 text-2xl md:text-3xl font-black font-orbitron uppercase tracking-tighter text-white leading-tight filter drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
              {hookText}
            </span>
          </motion.div>
          <div className="mt-4 text-[9px] font-orbitron text-[#34E0F7] bg-[#34E0F7]/10 px-3 py-1 rounded border border-[#34E0F7]/20 tracking-[0.3em] uppercase">Holographic_UI: ON</div>
        </div>
      )}

      {/* HUD Metadata Overlay */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20 items-start pointer-events-none">
        <div className="px-3 py-1 rounded-lg bg-black/70 border border-white/10 text-[7px] font-mono text-white/50 uppercase tracking-[0.2em] backdrop-blur-xl flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${imageUrl ? 'bg-[#34E0F7] shadow-[0_0_10px_#34E0F7]' : 'bg-red-500 animate-pulse'}`} />
          {imageUrl ? 'Pixel_Stable_Verified' : 'Signal_Interrupted'}
        </div>
      </div>

      {/* RECONSTRUCTING_PIXELS: Active Generation State */}
      <AnimatePresence>
        {isRefining && (
          <motion.div 
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0A0A12]/85 backdrop-blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-24 h-24 mb-10">
              <div className="absolute inset-0 border-4 border-[#34E0F7]/5 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-[#34E0F7] border-r-[#34E0F7]/40 rounded-full animate-spin" />
              <div className="absolute inset-4 border border-[#8C4DFF]/20 rounded-full animate-pulse" />
            </div>
            <div className="space-y-3 text-center">
              <p className="text-[#34E0F7] font-orbitron text-xs tracking-[0.6em] uppercase animate-pulse font-black">Reconstructing_Pixels</p>
              <div className="flex items-center justify-center gap-4">
                 <p className="text-white/20 text-[8px] font-mono uppercase tracking-widest">Syncing with Brand DNA</p>
                 <div className="w-20 h-[1px] bg-white/10" />
                 <p className="text-white/20 text-[8px] font-mono uppercase tracking-widest">No-Text Safety: ON</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartVision;
