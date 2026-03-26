
import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

interface TextLoaderProps {
  className?: string;
}

const TextLoader: React.FC<TextLoaderProps> = ({ className }) => {
  return (
    <div className={`absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <div className="relative w-full max-w-[80%] space-y-4">
        {/* Animated Lines representing text being generated */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1 bg-white/5 rounded-full relative overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.2
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#34E0F7] to-transparent w-1/2"
              />
            </div>
          ))}
        </div>

        {/* The Spaceship */}
        <div className="flex justify-center">
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, -2, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-[#34E0F7] drop-shadow-[0_0_15px_rgba(52,224,247,0.5)]"
          >
            <Rocket size={32} className="rotate-45" />
          </motion.div>
        </div>

        <div className="text-center">
          <motion.p
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-[0.3em]"
          >
            Generating Signal...
          </motion.p>
        </div>
      </div>
      
      {/* Scanning effect */}
      <motion.div
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-[#34E0F7]/30 shadow-[0_0_15px_#34E0F7]"
      />
    </div>
  );
};

export default TextLoader;
