'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Info, Search, Bell, MonitorPlay, 
  ChevronRight, Star, X, Mail, User
} from 'lucide-react';
// Animations ke liye Framer Motion zaroori hai is effect ke liye
import { motion, AnimatePresence } from 'framer-motion';
import TwinklingStars from '@/components/TwinklingStars';

// --- SKELETON COMPONENTS (Same as before) ---
const HeroSkeleton = () => (
  <div className="w-full h-[85vh] bg-gray-900/50 animate-pulse relative">
      <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-3xl space-y-4 pb-24 md:pb-48">
          <div className="h-10 md:h-12 w-3/4 bg-gray-800 rounded-lg"></div>
          <div className="h-4 w-full bg-gray-800 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
          <div className="flex gap-4 pt-4">
              <div className="h-12 w-32 bg-gray-800 rounded-lg"></div>
              <div className="h-12 w-32 bg-gray-800 rounded-lg"></div>
          </div>
      </div>
  </div>
);

const SectionSkeleton = () => (
  <div className="px-4 md:px-12 mb-12 space-y-4">
      <div className="h-6 w-32 md:w-48 bg-gray-800 rounded animate-pulse"></div>
      <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[130px] md:min-w-[180px] h-[200px] md:h-[270px] bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
      </div>
  </div>
);

const NavbarSkeleton = () => (
  <div className="h-16 md:h-20 w-full bg-gray-900/80 border-b border-gray-800 flex items-center justify-between px-4 md:px-12 animate-pulse">
      <div className="h-6 md:h-8 w-20 md:w-24 bg-gray-800 rounded"></div>
      <div className="flex gap-4">
          <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
      </div>
  </div>
);

// =====================================================================
// 💎 NEW PREMIUM "LIQUID GLASS" NAVBAR (iPhone Style)
// =====================================================================
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchActive && inputRef.current) {
        inputRef.current.focus();
    }
  }, [searchActive]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setSearchActive(false);
    }
  };

  // Navbar Container Style (Floating capsule on scroll)
  const navContainerStyle = scrolled 
    ? "top-4 inset-x-4 md:inset-x-auto md:w-[90%] max-w-6xl mx-auto rounded-full border-[0.5px] border-white/20 bg-black/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-2xl saturate-150"
    : "top-0 inset-x-0 bg-gradient-to-b from-black/70 to-transparent border-transparent";

  return (
    <motion.nav 
      layout // Smooth layout transitions for morphing
      className={`fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${navContainerStyle} py-3 md:py-4 px-6 flex justify-center`}
      style={{ 
        // Subtle inner glow for liquid effect
        boxShadow: scrolled ? "inset 0 0 20px rgba(255,255,255,0.05), 0 8px 32px 0 rgba(0,0,0,0.36)" : "none"
      }}
    >
      <div className="w-full flex items-center justify-between max-w-7xl relative">
      
      <AnimatePresence mode="wait">
        {searchActive ? (
        // ============ 🔍 EXPANDED SEARCH BAR MODE ============
         <motion.form 
           key="search-bar"
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           transition={{ duration: 0.3, ease: "easeOut" }}
           onSubmit={handleSearchSubmit}
           className="w-full flex items-center gap-4"
         >
             <Search className="text-yellow-500 shrink-0" size={24} />
             <input 
               ref={inputRef}
               type="text" 
               placeholder="Search movies, shows, genres..." 
               className="flex-grow bg-transparent border-none outline-none text-white placeholder-gray-400 text-lg h-full"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onBlur={() => !query && setSearchActive(false)}
             />
             <button 
                type="button" 
                onClick={() => setSearchActive(false)}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0"
             >
                 <X size={20} className="text-gray-300 hover:text-white"/>
             </button>
         </motion.form>

        ) : (
        // ============ 📺 NORMAL NAVIGATION MODE ============
         <motion.div 
           key="normal-nav"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.2 }}
           className="w-full flex items-center justify-between"
         >
            {/* LOGO */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
                <div className="relative p-1">
                    <div className="absolute inset-0 bg-yellow-500 blur-[12px] opacity-30 group-hover:opacity-50 transition-opacity rounded-full animate-pulse-slow"></div>
                    <MonitorPlay className="text-yellow-500 relative z-10 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)] transition-transform group-hover:scale-110" size={30} />
                </div>
                <span className="hidden md:block text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-yellow-500 font-sans drop-shadow-sm">
                    SADABEFY
                </span>
            </div>

            {/* DESKTOP LINKS (Clean & Minimal) */}
            <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-300/80">
                {['Home', 'Movies', 'Series', 'My List'].map((item) => (
                <motion.span 
                    key={item} 
                    className="hover:text-white transition-all cursor-pointer relative group/link px-3 py-2 rounded-full hover:bg-white/5"
                    whileHover={{ scale: 1.05 }}
                >
                    {item}
                </motion.span>
                ))}
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-3 md:gap-5">
                <motion.button whileHover={{ scale: 1.1, rotate: 5 }} onClick={() => setSearchActive(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Search className="w-6 h-6 text-gray-200" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1, rotate: -10 }} className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
                    <Bell className="w-6 h-6 text-gray-200" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </motion.button>
                
                {/* Profile (Gradient Border) */}
                <motion.div whileHover={{ scale: 1.05 }} className="hidden md:flex p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 to-amber-700 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center">
                        <User size={18} className="text-yellow-100" />
                    </div>
                </motion.div>
            </div>
         </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// --- HERO SLIDER COMPONENT (Unchanged mostly, just container adjustment) ---
const HeroSlider = ({ data }: { data: any[] }) => {
    const [current, setCurrent] = useState(0);
    const router = useRouter();
  
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrent(prev => (prev + 1) % (data.length || 1));
      }, 7000);
      return () => clearInterval(timer);
    }, [data]);

    if (!data || data.length === 0) return null;
    const movie = data[current];

    const handlePlayClick = () => {
        if (movie.link) {
            const encodedLink = btoa(movie.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            router.push(`/v/${encodedLink}`);
        } else {
            router.push(`/search?q=${encodeURIComponent(movie.title)}`);
        }
    };
  
    return (
      <div className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden group">
         {/* BACKGROUND */}
         <div className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out opacity-0"
                 style={{ backgroundImage: `url(${data[(current - 1 + data.length) % data.length]?.poster})` }}>
            </div>
            <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-105 group-hover:scale-110"
                 style={{ backgroundImage: `url(${movie.poster})` }}>
            </div>
            {/* Extra dark gradient at top for navbar contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-[#0a0a0a]"></div> 
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent"></div>
         </div>
  
         {/* CONTENT */}
         <div className="absolute bottom-0 left-0 w-full max-w-4xl flex flex-col gap-4 md:gap-6 z-10 px-6 md:px-16 pb-24 md:pb-48">
             <div className="flex items-center gap-3 animate-fade-in-up">
                 <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 md:px-3 md:py-1 text-[10px] md:text-xs font-bold rounded-md border border-yellow-500/30 flex items-center gap-1">
                   <Star size={10} fill="currentColor" /> {movie.rating}
                 </span>
                 <div className="flex gap-2 overflow-hidden">
                    {movie.tags?.slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="text-gray-300 text-[10px] md:text-xs font-medium uppercase tracking-wider border-l border-gray-600 pl-3">
                            {tag}
                        </span>
                    ))}
                 </div>
             </div>
  
             <h1 className="text-4xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl animate-slide-in">
                {movie.title}
             </h1>
  
             <p className="text-gray-300 text-sm md:text-lg line-clamp-2 md:line-clamp-3 max-w-xl drop-shadow-md animate-fade-in delay-100">
                {movie.desc}
             </p>
  
             <div className="flex gap-3 md:gap-4 pt-2 md:pt-4 animate-fade-in delay-200 pointer-events-auto">
                <button 
                  onClick={handlePlayClick}
                  className="bg-white text-black px-6 md:px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 md:gap-3 hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95 text-sm md:text-base shadow-lg shadow-white/10"
                >
                    <Play fill="black" size={18} /> 
                    Watch Now
                </button>
                <button className="bg-gray-600/40 backdrop-blur-md text-white px-6 md:px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 md:gap-3 hover:bg-gray-600/60 transition-all border border-white/10 text-sm md:text-base">
                    <Info size={18} /> More Info
                </button>
             </div>
         </div>
  
         <div className="absolute right-4 md:right-12 bottom-1/2 translate-y-1/2 flex flex-col gap-2 md:gap-4 z-20">
             {data.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1 md:w-1.5 h-8 md:h-12 rounded-full transition-all duration-300 ${
                    idx === current ? 'bg-yellow-500 scale-y-125' : 'bg-gray-700/50'
                  }`}
                />
            ))}
         </div>
      </div>
    );
};

// --- MOVIE ROW SECTION (Unchanged) ---
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
            const encodedLink = btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            router.push(`/v/${encodedLink}`);
        } else {
            router.push(`/search?q=${encodeURIComponent(item.title)}`);
        }
    };

    const handleViewAll = () => {
        if (slug) {
            router.push(`/category/${slug}`);
        }
    };

    const getCleanTitle = (text: string) => {
        if (!text) return "Unknown";
        return text
            .replace(/^Download\s+/i, "")
            .replace(/\s*\(\d{4}\).*/, "")
            .replace(/\s*\[\d{4}\].*/, "")
            .replace(/\s*(?:4k|1080p|720p|480p|hd|cam|rip).*/i, "")
            .replace(/\s*(?:Season|S)\s*0?\d+.*/i, "")
            .replace(/[\[\]\(\)]/g, "")
            .trim();
    };

    if (!items || items.length === 0) return null;
  
    return (
      <div className="mb-8 md:mb-12 relative group/section px-4 md:px-12">
        <div className="flex justify-between items-end mb-4 md:mb-6 px-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-100 flex items-center gap-2 group-hover/section:text-yellow-400 transition-colors">
                {title} 
                <ChevronRight size={20} className="opacity-0 group-hover/section:opacity-100 transition-opacity -translate-x-2 group-hover/section:translate-x-0" />
            </h2>
            
            {slug && (
                <button 
                    onClick={handleViewAll}
                    className="text-xs md:text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-white/50 bg-transparent px-4 py-1 rounded-full transition-all hover:bg-white/10"
                >
                    View All
                </button>
            )}
        </div>
  
        <div className="relative group">
            <ChevronRight 
                className="hidden md:block absolute left-0 top-0 bottom-0 z-20 m-auto h-full w-12 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/70 cursor-pointer transition-all rotate-180 text-white" 
                onClick={() => scroll('left')} 
            />
            
            <div 
              ref={rowRef}
              className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-1"
            >
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col gap-2 min-w-[130px] md:min-w-[180px] group/item cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                    <div className="relative w-full h-[200px] md:h-[270px] rounded-lg overflow-hidden transition-all duration-300 group-hover/item:scale-105 group-hover/item:shadow-lg group-hover/item:shadow-yellow-500/20 bg-gray-900 z-10">
                        <img 
                          src={item.image || item.poster} 
                          alt={item.title} 
                          className="w-full h-full object-cover opacity-90 group-hover/item:opacity-100 transition-opacity" 
                          loading="lazy"
                          />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <div className="flex gap-2 justify-center">
                                 <div className="bg-white text-black p-2 rounded-full hover:bg-yellow-400 transition-colors scale-0 group-hover/item:scale-100 duration-300">
                                     <Play size={12} fill="currentColor" />
                                 </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-gray-300 font-medium text-xs md:text-sm truncate pl-1 group-hover/item:text-yellow-400 transition-colors">
                        {getCleanTitle(item.title)}
                    </h3>
                </div>
              ))}
            </div>
  
            <ChevronRight 
                className="hidden md:block absolute right-0 top-0 bottom-0 z-20 m-auto h-full w-12 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/70 cursor-pointer transition-all text-white" 
                onClick={() => scroll('right')} 
            />
        </div>
      </div>
    );
};

// --- MAIN PAGE LOGIC (Unchanged) ---
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
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
         <X size={48} className="text-red-500 mb-4" />
         <h1 className="text-2xl font-bold">Failed to load content</h1>
         <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-600 rounded hover:bg-red-700">Retry</button>
      </div>
    );
  }

  if (loading) {
    return (
       <div className="min-h-screen bg-[#0a0a0a]">
           <NavbarSkeleton />
           <HeroSkeleton />
           <SectionSkeleton />
           <SectionSkeleton />
       </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-transparent text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      
      {/* Stars Background */}
      <TwinklingStars />

      {/* Main Content Overlay */}
      <div className="relative z-10 bg-[#0a0a0a]">
          <Navbar />

          <div className="pb-20">
            {data?.hero && <HeroSlider data={data.hero} />}

            <div className="-mt-16 md:-mt-24 relative z-20 space-y-6 md:space-y-8">
                {data?.sections?.map((sec: any, idx: number) => (
                    <MovieSection key={idx} title={sec.title} items={sec.items} slug={sec.slug} />
                ))}
            </div>
          </div>

          <footer className="bg-[#0a0a0a] border-t border-gray-900 py-10 md:py-16 px-6 md:px-20 relative z-30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                          <MonitorPlay className="text-yellow-500" size={28} />
                          <span className="text-xl md:text-2xl font-black text-white">SADABEFY</span>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed">
                          Your premium destination for unlimited entertainment.
                      </p>
                  </div>
                  <div>
                      <h4 className="text-white font-bold mb-4 md:mb-6">Explore</h4>
                      <ul className="space-y-2 md:space-y-3 text-gray-400 text-sm">
                          {['Home', 'Movies', 'TV Shows'].map(item => (
                              <li key={item} className="hover:text-yellow-400 cursor-pointer transition-colors">{item}</li>
                          ))}
                      </ul>
                  </div>
                  <div>
                      <h4 className="text-white font-bold mb-4 md:mb-6">Support</h4>
                      <ul className="space-y-2 md:space-y-3 text-gray-400 text-sm">
                           {['Terms of Service', 'Privacy Policy'].map(item => (
                              <li key={item} className="hover:text-yellow-400 cursor-pointer transition-colors">{item}</li>
                          ))}
                      </ul>
                  </div>
                  <div>
                      <h4 className="text-white font-bold mb-4 md:mb-6">Contact</h4>
                      <ul className="space-y-4 text-sm">
                           <li className="flex items-center gap-3 text-gray-400">
                              <Mail size={18} className="text-yellow-500"/> 
                              <span className="hover:text-white cursor-pointer break-all">contact@sadabefy.com</span>
                           </li>
                      </ul>
                  </div>
              </div>
              <div className="border-t border-gray-900 pt-8 mt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-gray-500 text-sm">
                      <h4 className="text-lg font-bold text-yellow-500">Sadab Codes</h4>
                  </div>
                  <div className="text-gray-600 text-xs text-center md:text-right">
                      <p>© 2025 Sadabefy.</p>
                  </div>
              </div>
          </footer>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
