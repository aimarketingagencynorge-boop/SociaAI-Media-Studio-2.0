
import React from 'react';
import { motion } from 'framer-motion';

const Hyperspace: React.FC = () => {
  const lines = Array.from({ length: 40 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center pointer-events-none"
    >
      <div className="absolute inset-0 bg-[#0A0A12]" />
      {lines.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: '50%',
            y: '50%',
            width: 0,
            height: 2,
            rotate: Math.random() * 360,
            opacity: 0,
          }}
          animate={{
            width: '200%',
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            ease: "easeIn",
            delay: Math.random() * 0.5,
          }}
          style={{
            transformOrigin: 'left center',
            backgroundColor: i % 2 === 0 ? '#34E0F7' : '#8C4DFF',
            boxShadow: `0 0 10px ${i % 2 === 0 ? '#34E0F7' : '#8C4DFF'}`,
          }}
          className="absolute"
        />
      ))}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="relative z-10 text-4xl font-black font-orbitron text-[#34E0F7] tracking-[1em]"
      >
        JUMPING
      </motion.div>
    </motion.div>
  );
};

export default Hyperspace;
