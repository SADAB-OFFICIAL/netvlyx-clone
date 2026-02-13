'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Info, Search, MonitorPlay, 
  ChevronRight, Star, X, Mail
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
// @ts-ignore (Optional: If you don't have this component, remove it or keep it as is)
import TwinklingStars from '@/components/TwinklingStars';

// --- SKELETONS ---
const HeroSkeleton = () => (
  <div className="w-full h-[85vh] md:h-[90vh] bg-[#050505] animate-pulse flex items-center">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 space-y-6">
              <div className="h-6 w-32 bg-gray-800 rounded-full"></div>
              <div className="h-16 md:h-24 w-full bg-gray-800 rounded-2xl"></div>
              <div className="h-24 w-3/4 bg-gray-800 rounded-xl"></div>
              <div className="flex gap-4"><div className="h-12 w-40 bg-gray-800 rounded-full"></div></div>
          </div>
          <div className="hidden md:block w-1/2">
              <div className="w-[400px] h-[600px] bg-gray-800 rounded-3xl ml-auto"></div>
          </div>
      </div>
  </div>
);

const SectionSkeleton = () => (
  <div className="px-4 md:px-12 mb-12 space-y-4">
      <div className="h-6 w-32 md:w-48 bg-gray-800 rounded animate-pulse"></div>
      <div className="flex gap-4 overflow-hidden">
          {[1,2,3,4,5].map(i=><div key={i} className="min-w-[130px] md:min-w-[180px] h-[200px] md:h-[270px] bg-gray-800 rounded-2xl animate-pulse"/>)}
      </div>
  </div>
);

const NavbarSkeleton = () => (
  <div className="h-20 w-full bg-black animate-pulse"/>
);

// =====================================================================
// 💧 GOLD LIQUID NAVBAR 
// =====================================================================
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <motion.nav
      className={`fixed left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        scrolled ? 'top-4' : 'top-0'
      }`}
    >
      <div 
        className={`
          flex items-center justify-between transition-all duration-500 ease-in-out
          ${scrolled 
             ? 'w-[92%] md:w-auto px-4 py-2.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]' 
             : 'w-full px-6 py-5 bg-gradient-to-b from-black/80 to-transparent border-transparent'}
        `}
      >
        {/* LOGO */}
        <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={() => router.push('/')}>
            <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 blur-[10px] opacity-20 group-hover:opacity-50 transition-opacity rounded-full"></div>
                <MonitorPlay size={scrolled ? 28 : 32} className="text-yellow-500 relative z-10 transition-all duration-300 group-hover:scale-110 drop-shadow-md" />
            </div>
            <span className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 font-sans drop-shadow-sm transition-all duration-300 ${scrolled ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
              SADABEFY
            </span>
        </div>

        {/* SEARCH */}
        <form onSubmit={handleSearchSubmit} className="relative group/search ml-4 flex-1 md:flex-none flex justify-end">
          <div className={`flex items-center rounded-full transition-all duration-500 border border-white/5 ${scrolled ? 'bg-black/30 hover:bg-black/50 w-full md:w-[220px] py-2 px-3' : 'bg-black/40 hover:bg-black/60 w-full md:w-[260px] py-2.5 px-4 backdrop-blur-md'}`}>
             <Search className="text-gray-400 group-focus-within/search:text-yellow-500 transition-colors mr-2 shrink-0" size={18} />
             <input 
                type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..."
                className="bg-transparent border-none outline-none text-white text-sm placeholder-gray-400/80 w-full font-medium"
             />
          </div>
        </form>

        {/* LINKS */}
        <div className={`hidden md:flex items-center gap-6 ml-6 transition-opacity duration-300 ${scrolled ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'}`}>
             {['Home', 'Series', 'Movies', 'New'].map((item) => (
                <span key={item} className="text-sm font-medium text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors relative group/link">
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-yellow-500 transition-all group-hover/link:w-full"></span>
                </span>
             ))}
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 p-[1px] cursor-pointer hover:scale-105 transition-transform">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                  <span className="text-yellow-500 text-xs font-bold">S</span>
                </div>
             </div>
        </div>

      </div>
    </motion.nav>
  );
};

// =====================================================================
// 🎬 NEW 3D PARALLAX HERO SLIDER (Apple TV+ Vibe)
// =====================================================================
const HeroSlider = ({ data }: { data: any[] }) => {
    const [current, setCurrent] = useState(0);
    const router = useRouter();

    // 🎭 3D Parallax State & Physics (Framer Motion)
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
    
    // Tilt calculation mapping mouse position to rotation degrees
    const rotateX = useTransform(mouseYSpring, [-300, 300], [12, -12]);
    const rotateY = useTransform(mouseXSpring, [-300, 300], [-12, 12]);

    useEffect(() => {
        const timer = setInterval(() => setCurrent(p => (p + 1) % (data.length || 1)), 8000); // 8 sec for premium feel
        return () => clearInterval(timer);
    }, [data]);

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

    // Track mouse to move the card
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        x.set(0); y.set(0); // Reset position gracefully
    };
  
    return (
      <div className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden flex items-center bg-[#050505]">
         
         {/* 🌟 1. DYNAMIC AMBIENT AURA (Background Glow) 🌟 */}
         <AnimatePresence mode="wait">
            <motion.div
                key={current}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.5, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full z-0 pointer-events-none"
            >
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url(${movie.poster})`,
                        filter: 'blur(80px) saturate(200%) brightness(0.7)' // Heavy blur for aura
                    }}
                />
            </motion.div>
         </AnimatePresence>

         {/* Dark Overlays for Text Legibility and blending into rows */}
         <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-0 pointer-events-none"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-0 pointer-events-none h-full"></div>
  
         {/* 🌟 2. HERO CONTENT (Apple TV Split Layout) 🌟 */}
         <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-12 pb-10 pt-24 gap-8 md:gap-16">
             
             {/* LEFT: Cinematic Info */}
             <div className="w-full md:w-[55%] flex flex-col gap-5 md:gap-6 mt-6 md:mt-0">
                 {/* Badges */}
                 <div className="flex flex-wrap items-center gap-3">
                     <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1.5 text-xs font-bold rounded-full border border-yellow-500/20 flex items-center gap-1.5 backdrop-blur-md shadow-lg shadow-yellow-500/10">
                       <Star size={12} fill="currentColor" /> {movie.rating} Rating
                     </span>
                     <div className="flex gap-2">
                       {movie.tags?.slice(0, 3).map((tag: string, i: number) => (
                           <span key={i} className="text-gray-300 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wider border border-white/10">{tag}</span>
                       ))}
                     </div>
                 </div>

                 {/* Title */}
                 <AnimatePresence mode="wait">
                    <motion.h1 
                        key={movie.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl"
                    >
                        {movie.title}
                    </motion.h1>
                 </AnimatePresence>

                 {/* Description */}
                 <AnimatePresence mode="wait">
                    <motion.p 
                        key={movie.desc}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-gray-300 text-sm md:text-lg line-clamp-3 md:line-clamp-4 max-w-xl drop-shadow-lg leading-relaxed font-medium"
                    >
                        {movie.desc}
                    </motion.p>
                 </AnimatePresence>

                 {/* Buttons */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-wrap gap-4 pt-4 z-50"
                 >
                    <button onClick={handlePlayClick} className="bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95 text-base shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        <Play fill="black" size={20} /> Watch Movie
                    </button>
                    <button className="bg-white/10 backdrop-blur-2xl text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-white/20 transition-all border border-white/20 hover:border-white/40 active:scale-95 text-base">
                        <Info size={20} /> Details
                    </button>
                 </motion.div>
             </div>

             {/* RIGHT: 3D PARALLAX POSTER */}
             <div className="w-full md:w-[45%] flex justify-center md:justify-end perspective-[2000px] z-50">
                 <motion.div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handlePlayClick}
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    className="relative w-[240px] md:w-[320px] lg:w-[380px] aspect-[2/3] cursor-pointer group"
                 >
                    {/* Shadow Glow behind card */}
                    <div className="absolute -inset-4 bg-yellow-500/20 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 pointer-events-none"></div>

                    {/* Main Poster Card */}
                    <AnimatePresence mode="wait">
                       <motion.div
                         key={movie.poster}
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.6 }}
                         style={{ transform: "translateZ(30px)" }} // Pops out slightly
                         className="absolute inset-0 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-gray-900 z-10"
                       >
                           <img src={movie.poster} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Poster" />
                           {/* Glass Shine */}
                           <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                       </motion.div>
                    </AnimatePresence>

                    {/* 3D Floating Play Button (Pops out of the card!) */}
                    <motion.div
                       style={{ transform: "translateZ(80px)" }} // Pops out a LOT
                       className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    >
                       <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                          <Play size={32} className="text-white fill-white ml-2" />
                       </div>
                    </motion.div>
                 </motion.div>
             </div>
         </div>

         {/* Custom Dots */}
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
             {data.map((_, idx) => (
                <div 
                   key={idx} 
                   onClick={() => setCurrent(idx)}
                   className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${idx === current ? 'w-8 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                />
            ))}
         </div>
      </div>
    );
};

// --- MOVIE SECTION (Enhanced with Liquid Glass touches) ---
const MovieSection = ({ title, items, slug }: { title: string, items: any[], slug?: string }) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
  
    const scroll = (direction: 'left' | 'right') => {
      if (rowRef.current) {
        const { scrollLeft, clientWidth } = rowRef.current;
        const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
        rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    };

    const handleItemClick = (item: any) => {
        if (item.link) {
            const encoded = btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            router.push(`/v/${encoded}`);
        } else { router.push(`/search?q=${encodeURIComponent(item.title)}`); }
    };

    const getCleanTitle = (text: string) => {
        if (!text) return "Unknown";
        return text.replace(/^Download\s+/i, "").replace(/\s*\(\d{4}\).*/, "").replace(/\s*\[\d{4}\].*/, "").replace(/\s*(?:4k|1080p|720p|480p|hd|cam|rip).*/i, "").replace(/\s*(?:Season|S)\s*0?\d+.*/i, "").replace(/[\[\]\(\)]/g, "").trim();
    };

    if (!items || items.length === 0) return null;

    return (
      <div className="mb-10 md:mb-14 relative group/section px-4 md:px-12">
        <div className="flex justify-between items-end mb-5 md:mb-6 px-1">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 group-hover/section:text-yellow-400 transition-colors">
                {title} 
                <ChevronRight size={20} className="opacity-0 group-hover/section:opacity-100 transition-opacity -translate-x-2 group-hover/section:translate-x-0" />
            </h2>
            {slug && <button onClick={() => router.push(`/category/${slug}`)} className="text-xs md:text-sm font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-white/50 bg-white/5 backdrop-blur-md px-5 py-1.5 rounded-full transition-all hover:bg-white/10 active:scale-95">View All</button>}
        </div>
        <div className="relative group">
            <ChevronRight className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 m-auto h-full w-14 bg-gradient-to-r from-[#0a0a0a] to-transparent opacity-0 group-hover:opacity-100 cursor-pointer transition-all rotate-180 text-white items-center justify-start pl-2" onClick={() => scroll('left')} />
            
            <div ref={rowRef} className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-6 px-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-3 min-w-[140px] md:min-w-[180px] group/item cursor-pointer" onClick={() => handleItemClick(item)}>
                    <div className="relative w-full h-[210px] md:h-[270px] rounded-2xl overflow-hidden transition-all duration-300 group-hover/item:scale-[1.03] group-hover/item:shadow-[0_15px_30px_rgba(0,0,0,0.6)] group-hover/item:border-white/20 border border-transparent bg-gray-900 z-10">
                        <img src={item.image || item.poster} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover/item:opacity-100 transition-opacity" loading="lazy"/>
                        
                        {/* Hover Play Glass */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center backdrop-blur-[2px]">
                            <div className="bg-white/20 backdrop-blur-md border border-white/40 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:border-yellow-400 hover:text-black transition-all scale-0 group-hover/item:scale-100 duration-300 shadow-xl">
                               <Play size={20} className="ml-1 fill-current" />
                            </div>
                        </div>
                    </div>
                    <h3 className="text-gray-300 font-semibold text-sm md:text-base truncate px-1 group-hover/item:text-yellow-400 transition-colors drop-shadow-md">{getCleanTitle(item.title)}</h3>
                </div>
              ))}
            </div>

            <ChevronRight className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 m-auto h-full w-14 bg-gradient-to-l from-[#0a0a0a] to-transparent opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-white items-center justify-end pr-2" onClick={() => scroll('right')} />
        </div>
      </div>
    );
};

// --- MAIN PAGE ---
function HomePageContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/home', { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setData(json.data);
      } catch (e) { setError(true); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (error) return <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white"><X size={48} className="text-red-500 mb-4"/><h1 className="text-2xl font-bold">Failed to load content</h1><button onClick={()=>window.location.reload()} className="mt-4 px-6 py-2 bg-red-600 rounded-full font-bold">Retry</button></div>;
  if (loading) return <div className="min-h-screen bg-[#0a0a0a]"><NavbarSkeleton /><HeroSkeleton /><SectionSkeleton /></div>;

  return (
    <div className="min-h-screen relative bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Optional: Remove TwinklingStars if it conflicts with the new Aura, or keep for extra magic */}
      <TwinklingStars />
      <div className="relative z-10 bg-transparent">
          <Navbar />
          
          <div className="pb-10">
            {data?.hero && <HeroSlider data={data.hero} />}
            
            {/* Soft gradient transition into the rows */}
            <div className="relative z-20 -mt-20 pt-20 bg-gradient-to-b from-transparent to-[#0a0a0a]">
                <div className="space-y-6 md:space-y-10">
                    {data?.sections?.map((sec: any, idx: number) => (
                        <MovieSection key={idx} title={sec.title} items={sec.items} slug={sec.slug} />
                    ))}
                </div>
            </div>
          </div>

          <footer className="bg-[#050505] border-t border-white/5 py-12 md:py-16 px-6 md:px-20 relative z-30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
                  <div className="space-y-4">
                      <div className="flex items-center gap-2"><MonitorPlay className="text-yellow-500" size={28} /><span className="text-xl md:text-2xl font-black text-white">SADABEFY</span></div>
                      <p className="text-gray-500 text-sm leading-relaxed">Your premium destination for ultimate cinematic entertainment.</p>
                  </div>
                  <div><h4 className="text-white font-bold mb-4">Explore</h4><ul className="space-y-3 text-gray-400 text-sm">{['Home', 'Movies', 'TV Shows', 'Trending'].map(item => <li key={item} className="hover:text-yellow-400 cursor-pointer transition-colors">{item}</li>)}</ul></div>
                  <div><h4 className="text-white font-bold mb-4">Legal</h4><ul className="space-y-3 text-gray-400 text-sm">{['Terms of Service', 'Privacy Policy', 'DMCA'].map(item => <li key={item} className="hover:text-yellow-400 cursor-pointer transition-colors">{item}</li>)}</ul></div>
                  <div><h4 className="text-white font-bold mb-4">Contact</h4><ul className="space-y-4 text-sm"><li className="flex items-center gap-3 text-gray-400"><Mail size={18} className="text-yellow-500"/> <span className="hover:text-white cursor-pointer break-all transition-colors">contact@sadabefy.com</span></li></ul></div>
              </div>
              <div className="border-t border-white/5 pt-8 mt-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
                  <div className="text-gray-500 text-sm"><h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">Sadab Codes</h4></div>
                  <div className="text-gray-600 text-xs text-center md:text-right font-medium"><p>© 2026 Sadabefy. All rights reserved.</p></div>
              </div>
          </footer>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <Suspense fallback={<div className="h-screen bg-[#0a0a0a] text-white flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={32}/></div>}><HomePageContent /></Suspense>;
}
