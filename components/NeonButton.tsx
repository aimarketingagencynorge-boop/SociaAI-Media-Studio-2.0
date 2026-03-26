
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: 'purple' | 'cyan' | 'magenta';
  glow?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const NeonButton: React.FC<Props> = ({ 
  children, 
  onClick, 
  className = "", 
  variant = 'purple', 
  glow = true,
  disabled = false,
  type = 'button'
}) => {
  const variants = {
    purple: 'border-[#8C4DFF] text-white bg-[#8C4DFF]/10 hover:bg-[#8C4DFF] hover:text-white',
    cyan: 'border-[#34E0F7] text-[#34E0F7] bg-[#34E0F7]/5 hover:bg-[#34E0F7] hover:text-black',
    magenta: 'border-[#C74CFF] text-white bg-[#C74CFF]/10 hover:bg-[#C74CFF] hover:text-white',
  };

  const glows = {
    purple: 'shadow-[0_0_30px_rgba(140,77,255,0.4)]',
    cyan: 'shadow-[0_0_30px_rgba(52,224,247,0.4)]',
    magenta: 'shadow-[0_0_30px_rgba(199,76,255,0.4)]',
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.05, y: -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 md:px-8 md:py-4 border-2 rounded-2xl font-orbitron transition-all duration-500 text-xs md:text-sm tracking-[0.2em] uppercase font-bold
        ${variants[variant]}
        ${glow ? glows[variant] : ''}
        ${disabled ? 'opacity-30 cursor-not-allowed filter grayscale' : 'cursor-pointer'}
        backdrop-blur-sm
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};

export default NeonButton;
