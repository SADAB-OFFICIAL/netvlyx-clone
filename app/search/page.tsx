'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Info, Search, MonitorPlay, 
  ChevronRight, Star, X, Mail, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'light': navigator.vibrate(10); break; 
      case 'medium': navigator.vibrate(20); break; 
    }
  }
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <motion.nav className={`fixed left-0 right-0 z-50 flex justify-center transition-all duration-500 ${scrolled ? 'top-2 md:top-4' : 'top-0'}`}>
      <div className={`flex items-center justify-between transition-all duration-500 ${scrolled ? 'w-[95%] md:w-auto px-4 py-2.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-2xl shadow-xl' : 'w-full px-5 py-4 bg-gradient-to-b from-black/90 to-transparent'}`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <MonitorPlay size={24} className="text-yellow-500" />
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 hidden sm:block">SADABEFY</span>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex-1 md:flex-none flex justify-end ml-4 max-w-[250px]">
          <div className="flex items-center rounded-full bg-white/5 border border-white/10 w-full py-1.5 px-3 backdrop-blur-md focus-within:bg-white/10 transition-colors">
             <Search className="text-gray-400 mr-2" size={16} />
             <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-white text-sm w-full" />
          </div>
        </form>
      </div>
    </motion.nav>
  );
};

const HeroSlider = ({ data }: { data: any[] }) => {
    const [current, setCurrent] = useState(0);
    const router = useRouter();

    const AUTO_PLAY_DURATION = 8000;

    useEffect(() => {
        const timer = setInterval(() => setCurrent(p => (p + 1) % (data.length || 1)), AUTO_PLAY_DURATION);
        return () => clearInterval(timer);
    }, [data, current]);

    if (!data || data.length === 0) return null;
    const movie = data[current];

    const handlePlayClick = () => {
        if (movie.link) {
            const encoded = btoa(movie.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            router.push(`/v/${encoded}`);
        } else {
            router.push(`/search?q=${encodeURIComponent(movie.title)}`);
        }
    };

    return (
      <div className="relative min-h-[100svh] md:h-[95vh] w-full overflow-hidden flex flex-col justify-center bg-[#050505] pt-20 pb-8 md:pt-0 md:pb-0">
         
         {/* Background Aura */}
         <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${movie.poster})`, filter: 'blur(60px) saturate(150%) brightness(0.4)' }} />
            </motion.div>
         </AnimatePresence>

         <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-0 pointer-events-none"></div>
  
         <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between px-6 gap-8">
             
             {/* Poster for Mobile (Smaller to save space) */}
             <div className="w-[160px] aspect-[2/3] md:hidden rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50">
                <img src={movie.poster} className="w-full h-full object-cover" alt="Poster" />
             </div>

             {/* Text Content */}
             <div className="w-full md:w-[50%] flex flex-col items-center md:items-start text-center md:text-left gap-4">
                 <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                     <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1 text-xs font-bold rounded-full border border-yellow-500/20 flex items-center gap-1">
                       <Star size={12} fill="currentColor" /> {movie.rating || "Top"}
                     </span>
                 </div>

                 <motion.h1 key={movie.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg">
                     {movie.title}
                 </motion.h1>

                 <motion.p key={movie.desc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-300 text-sm md:text-base line-clamp-3 max-w-md">
                     {movie.desc}
                 </motion.p>

                 {/* Buttons (Grid on mobile to save vertical space) */}
                 <div className="grid grid-cols-2 md:flex md:flex-row w-full md:w-auto gap-3 pt-2">
                    <button onClick={handlePlayClick} className="w-full justify-center bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform text-sm">
                        <Play fill="black" size={16} /> Watch
                    </button>
                    <button className="w-full justify-center bg-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/20 active:scale-95 transition-transform text-sm backdrop-blur-md">
                        <Info size={16} /> Details
                    </button>
                 </div>

                 {/* 🌟 THE FIX: DOTS IN NORMAL FLOW ON MOBILE 🌟 */}
                 {/* This prevents it from EVER overlapping the buttons */}
                 <div className="flex gap-2 mt-6 md:absolute md:bottom-10 md:left-1/2 md:-translate-x-1/2 bg-black/40 px-3 py-2 rounded-full border border-white/10 backdrop-blur-md">
                     {data.map((_, idx) => (
                        <div key={idx} onClick={() => setCurrent(idx)} className="h-1.5 rounded-full overflow-hidden bg-white/20 relative" style={{ width: idx === current ? '24px' : '6px', transition: 'width 0.3s' }}>
                            {idx === current && <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: AUTO_PLAY_DURATION / 1000, ease: "linear" }} key={`p-${current}`} className="absolute top-0 left-0 h-full bg-yellow-400" />}
                        </div>
                    ))}
                 </div>
             </div>

             {/* Poster for Desktop */}
             <div className="hidden md:flex w-[300px] lg:w-[350px] aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 z-50">
                 <img src={movie.poster} className="w-full h-full object-cover" alt="Poster" />
             </div>
         </div>
      </div>
    );
};

const MovieSection = ({ title, items }: { title: string, items: any[] }) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    if (!items || items.length === 0) return null;

    return (
      <div className="mb-10 relative px-4 md:px-12">
        <h2 className="text-xl font-bold text-white mb-4 pl-1">{title}</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
            {items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 min-w-[130px] md:min-w-[160px] snap-start cursor-pointer" onClick={() => router.push(item.link ? `/v/${btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}` : '/')}>
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 border border-white/5 active:scale-95 transition-transform">
                    <img src={item.image || item.poster} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <h3 className="text-gray-300 font-semibold text-xs md:text-sm truncate px-1">{item.title.replace(/^Download\s+/i, "").replace(/\s*\(\d{4}\).*/, "").trim()}</h3>
            </div>
            ))}
        </div>
      </div>
    );
};

function HomePageContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/home').then(res => res.json()).then(json => { setData(json.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={32}/></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      {data?.hero && <HeroSlider data={data.hero} />}
      <div className="relative z-20 -mt-6 md:-mt-10 pt-10 bg-gradient-to-b from-transparent to-[#0a0a0a]">
          {data?.sections?.map((sec: any, idx: number) => <MovieSection key={idx} title={sec.title} items={sec.items} />)}
      </div>
    </div>
  );
}

export default function HomePage() {
  return <Suspense fallback={<div className="h-screen bg-[#050505]"/>}><HomePageContent /></Suspense>;
}
