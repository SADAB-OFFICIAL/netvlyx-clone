// components/TwinklingStars.tsx
import React from 'react';

const TwinklingStars = () => {
  // Hum 60 taare banayenge random positions par
  const stars = Array.from({ length: 60 }).map((_, i) => {
    const size = Math.random() * 2 + 1 + 'px'; // Taare ka size (1px se 3px)
    const top = Math.random() * 100 + '%';      // Random vertical position
    const left = Math.random() * 100 + '%';     // Random horizontal position
    const duration = Math.random() * 3 + 2 + 's'; // Chamakne ki speed (2s se 5s)
    const delay = Math.random() * 2 + 's';        // Shuru hone ka delay

    return (
      <div
        key={i}
        className="star-twinkle bg-white/80 shadow-[0_0_4px_1px_rgba(255,255,255,0.3)]"
        style={{
          width: size,
          height: size,
          top: top,
          left: left,
          // Custom CSS variables pass kar rahe hain animation ke liye
          '--duration': duration,
          '--delay': delay,
        } as React.CSSProperties}
      ></div>
    );
  });

  return (
    // Ye container sabse peeche fixed rahega
    <div className="fixed inset-0 -z-50 bg-black overflow-hidden">
      {/* Ek halka sa gradient taaki upar se neeche thoda depth lage */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/80 -z-10"></div>
      {stars}
    </div>
  );
};

export default TwinklingStars;
