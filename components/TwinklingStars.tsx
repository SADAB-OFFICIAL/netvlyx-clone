// components/TwinklingStars.tsx
import React from 'react';

const TwinklingStars = () => {
  // Stars ki quantity thodi kam ki hai taaki bade stars clutter na karein
  const stars = Array.from({ length: 50 }).map((_, i) => {
    // SIZE UPDATED: Ab stars 2px se 4px ke beech honge (pehle 1-2px the)
    const size = Math.random() * 3 + 2 + 'px'; 
    const top = Math.random() * 100 + '%';
    const left = Math.random() * 100 + '%';
    const duration = Math.random() * 3 + 2 + 's';
    const delay = Math.random() * 2 + 's';

    return (
      <div
        key={i}
        // Shadow badha di taaki glow karein
        className="star-twinkle bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.6)]"
        style={{
          width: size,
          height: size,
          top: top,
          left: left,
          '--duration': duration,
          '--delay': delay,
        } as React.CSSProperties}
      ></div>
    );
  });

  return (
    <div className="fixed inset-0 -z-50 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/90 -z-10"></div>
      {stars}
    </div>
  );
};

export default TwinklingStars;
