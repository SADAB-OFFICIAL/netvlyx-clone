'use client';

import { motion } from 'framer-motion';

export default function AmbientBackground({ image }: { image: string }) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
      {/* 1. Deep Background Layer (Dominant Color Source) */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full"
      >
        <div 
          className="w-full h-full bg-cover bg-center opacity-60 blur-[100px] saturate-[200%] transform scale-125"
          style={{ backgroundImage: `url(${image})` }}
        />
      </motion.div>

      {/* 2. Liquid Breathing Effect (Slow Movement) */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1], 
          opacity: [0.4, 0.6, 0.4] 
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 w-full h-full"
      >
         <div 
            className="w-full h-full bg-cover bg-center blur-[120px] saturate-[180%]"
            style={{ backgroundImage: `url(${image})` }}
         />
      </motion.div>

      {/* 3. Black Overlay Gradients (Text Readability ke liye) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/50 to-transparent" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" /> {/* Noise/Texture smoother */}
    </div>
  );
}
