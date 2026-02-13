'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Play, Search, MonitorPlay, ChevronLeft, Star, Loader2, X, Film, Layers, Server 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import TwinklingStars from '@/components/TwinklingStars';

// --- 📱 HAPTIC ENGINE ---
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'light': navigator.vibrate(10); break; 
      case 'medium': navigator.vibrate(20); break; 
      case 'heavy': navigator.vibrate([30, 50, 30]); break; 
    }
  }
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Spotlight active trigger (Either focused or has text)
  const isActive = isFocused || searchTerm.trim().length > 0;

  // Live Search Logic
  useEffect(() => {
    if (!searchTerm.trim()) {
        setResults([]);
        return;
    }
    const delayDebounceFn = setTimeout(async () => {
        setLoading(true);
        window.history.replaceState(null, '', `/search?q=${encodeURIComponent(searchTerm)}`);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.results)) {
                setResults(data.results);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, 600); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleItemClick = (item: any) => {
      triggerHaptic('medium');
      if (item.link) {
          const encodedLink = btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
          router.push(`/v/${encodedLink}`);
      }
  };

  const getDynamicRating = (title: string) => {
      let hash = 0;
      for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
      return (Math.abs(hash % 30) / 10 + 6.5).toFixed(1);
  };
  
  const getYearFromTitle = (title: string) => {
      const match = title.match(/\((\d{4})\)/);
      return match ? match[1] : '2024';
  };
  
  const getSeasonBadge = (title: string, type: string) => {
      if (!type || type !== 'Series') return null;
      const t = title.toLowerCase();
      const isMulti = t.includes('season 1-') || t.includes('seasons') || t.includes('complete') || t.match(/season \d+\s?-\s?\d+/) || t.match(/s\d+\s?-\s?s\d+/);
      if (isMulti) return 'Multi (s)';
      const isSingle = t.includes('season') || t.match(/s\d+e\d+/) || t.match(/s\d+/);
      if (isSingle) return 'Single (s)';
      return 'Multi (s)';
  };

  const server1Results = results.filter(r => r.source === 'server_1');
  const server2Results = results.filter(r => r.source === 'server_2');

  // --- REUSABLE GRID COMPONENT (Liquid Pop) ---
  const ResultsGrid = ({ title, items, color }: { title: string, items: any[], color: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
      className="mb-12"
    >
        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${color}`}>
            <Server size={18} /> {title} 
            <span className="text-xs px-2 py-0.5 border border-white/20 rounded-full text-gray-400 bg-white/5">{items.length}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {items.map((item, idx) => {
                const dynamicRating = item.rating && item.rating !== "N/A" ? item.rating : getDynamicRating(item.title);
                const dynamicYear = getYearFromTitle(item.title);
                const seasonBadge = getSeasonBadge(item.title, item.type);

                return (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (idx % 10) * 0.05 }}
                        key={idx} 
                        className="group relative bg-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-yellow-500/50 transition-all duration-300 shadow-xl hover:shadow-[0_20px_40px_rgba(234,179,8,0.15)] hover:-translate-y-2 backdrop-blur-xl active:scale-95"
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="aspect-[2/3] relative overflow-hidden bg-gray-900">
                            <img src={item.image || item.poster} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:brightness-75" loading="lazy" />
                            <div className="absolute top-2 right-2 md:top-3 md:right-3 flex flex-col gap-1.5 items-end">
                                <span className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full text-[9px] md:text-[10px] font-bold text-white shadow-lg uppercase tracking-wider">{item.quality || 'HD'}</span>
                                {item.type && (
                                    <span className={`px-2 py-1 rounded-full text-[9px] md:text-[10px] font-bold text-white shadow-lg uppercase tracking-wider ${item.type === 'Series' ? 'bg-purple-600/90 backdrop-blur-md' : 'bg-blue-600/90 backdrop-blur-md'}`}>{item.type}</span>
                                )}
                                {seasonBadge && (
                                    <span className={`px-2 py-1 rounded-full text-[9px] md:text-[10px] font-bold shadow-lg uppercase tracking-wider flex items-center gap-1 border border-white/10 ${seasonBadge === 'Multi (s)' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white backdrop-blur-md' : 'bg-emerald-600/90 text-white backdrop-blur-md'}`}>
                                        <Layers size={10} /> {seasonBadge}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-300 delay-75 hover:bg-yellow-500 hover:border-yellow-400">
                                    <Play className="text-white hover:text-black ml-1 transition-colors fill-current" size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="p-3 md:p-5 relative z-10 bg-gradient-to-t from-black via-black/90 to-black/80">
                            <h3 className="text-gray-100 font-bold text-xs md:text-base leading-tight line-clamp-1 group-hover:text-yellow-400 transition-colors drop-shadow-md">{item.title}</h3>
                            <div className="flex items-center justify-between mt-2 md:mt-3 text-[10px] md:text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500 fill-yellow-500" /> <span className="font-semibold text-gray-200">{dynamicRating}</span></span>
                                <span className="flex items-center gap-1 opacity-70"><Film size={10} /> {dynamicYear}</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen relative bg-[#050505] text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden flex flex-col">
      {/* Dynamic Ambient Background Elements */}
      <TwinklingStars />
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <motion.div 
             animate={{ scale: isActive ? 1.2 : 1, opacity: isActive ? 0.3 : 0.15 }}
             transition={{ duration: 1.5 }}
             className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/30 rounded-full blur-[120px]"
          />
          <motion.div 
             animate={{ scale: isActive ? 1.2 : 1, opacity: isActive ? 0.3 : 0.1 }}
             transition={{ duration: 1.5 }}
             className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-yellow-600/20 rounded-full blur-[120px]"
          />
      </div>

      {/* 🌟 OVERLAP FIX: Proper Static Header for Back Button & Logo 🌟 */}
      <div className="relative z-50 w-full px-4 md:px-8 py-4 md:py-6 flex items-center justify-between max-w-[1920px] mx-auto">
          <button 
             onClick={() => { triggerHaptic('light'); router.back(); }} 
             className="p-3 md:p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95 cursor-pointer"
          >
              <ChevronLeft size={24} />
          </button>
          
          {/* Logo (Hidden on mobile when searching to save focus space) */}
          <div 
             className={`flex items-center gap-2 cursor-pointer transition-opacity duration-300 ${isActive ? 'opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto' : 'opacity-100'}`} 
             onClick={() => router.push('/')}
          >
              <MonitorPlay className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" size={24} />
              <span className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 tracking-tight">SADABEFY</span>
          </div>
      </div>

      {/* 🚀 MAC SPOTLIGHT COMMAND CENTER 🚀 */}
      {/* Margin Transition: Changes based on active state without hitting the header */}
      <motion.div 
         className="w-full max-w-4xl mx-auto px-4 relative z-40 flex flex-col items-center"
         animate={{ marginTop: isActive ? "1vh" : "20vh" }}
         transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
          {/* Hero Text - Only shows when centered */}
          <AnimatePresence>
             {!isActive && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-4 mb-8 md:mb-10 text-center"
                 >
                     <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                        <Search className="text-black" size={32} />
                     </div>
                     <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">What are you looking for?</h1>
                 </motion.div>
             )}
          </AnimatePresence>

          {/* MASSIVE SEARCH BAR */}
          <motion.div 
             layout
             className={`relative w-full group transition-all duration-500 ${isActive ? 'max-w-3xl' : 'max-w-4xl'}`}
          >
              <div className={`absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-yellow-500/40 via-purple-500/40 to-yellow-500/40 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 ${isActive ? 'opacity-50' : ''}`}></div>
              
              <div className={`relative flex items-center bg-black/40 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-500 group-focus-within:border-yellow-500/50 group-focus-within:bg-black/60 ${isActive ? 'rounded-[2rem] p-3 md:p-4' : 'rounded-[3rem] p-4 md:p-6'}`}>
                  
                  {loading ? (
                     <Loader2 className="text-yellow-500 animate-spin ml-2 md:ml-4 shrink-0" size={isActive ? 22 : 32} />
                  ) : (
                     <Search className={`${isActive ? 'text-yellow-500' : 'text-gray-400'} ml-2 md:ml-4 shrink-0 transition-colors duration-500`} size={isActive ? 22 : 32} />
                  )}
                  
                  {/* Form to handle Mobile Keyboard "Enter/Search" button */}
                  <form 
                     onSubmit={(e) => { e.preventDefault(); inputRef.current?.blur(); }} 
                     className="w-full flex-1"
                  >
                      <input 
                         ref={inputRef}
                         type="text" 
                         value={searchTerm} 
                         onChange={(e) => setSearchTerm(e.target.value)} 
                         onFocus={() => setIsFocused(true)}
                         onBlur={() => setIsFocused(false)}
                         placeholder="Search movies, series, anime..." 
                         className={`w-full bg-transparent border-none outline-none text-white ml-3 md:ml-6 placeholder-gray-500/70 font-medium transition-all duration-500 ${isActive ? 'text-base md:text-xl' : 'text-xl md:text-4xl'}`} 
                         autoFocus 
                      />
                  </form>
                  
                  <AnimatePresence>
                     {searchTerm && (
                         <motion.button 
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                            type="button" 
                            onClick={() => { triggerHaptic('light'); setSearchTerm(''); inputRef.current?.focus(); }}
                            className="mr-2 md:mr-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer active:scale-90"
                         >
                            <X size={isActive ? 18 : 28} className="text-gray-300 hover:text-white" />
                         </motion.button>
                     )}
                  </AnimatePresence>
              </div>
          </motion.div>
          
          {/* Quick Filters */}
          <AnimatePresence>
            {!searchTerm && isActive && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                 className="flex flex-wrap justify-center gap-2 md:gap-3 mt-6 md:mt-8"
               >
                  {['Latest Movies', 'Trending Series', 'Netflix', 'Marvel', 'Anime'].map((tag) => (
                      <button 
                         key={tag} 
                         onClick={() => { triggerHaptic('light'); setSearchTerm(tag); }}
                         className="px-4 md:px-5 py-2 md:py-2.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-xs md:text-sm font-medium text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md"
                      >
                         {tag}
                      </button>
                  ))}
               </motion.div>
            )}
          </AnimatePresence>
      </motion.div>

      {/* 🔮 RESULTS STAGE 🔮 */}
      <div className="relative z-30 w-full max-w-[1920px] mx-auto px-4 md:px-12 pb-24 mt-6 md:mt-12 flex-1">
          <AnimatePresence>
              {isActive && searchTerm && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      
                      <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6">
                          <h1 className="text-xl md:text-3xl font-black text-white flex items-center gap-2 md:gap-3 tracking-tight">
                              {loading ? (
                                  <span className="flex items-center gap-2 text-yellow-500">
                                     Searching <span className="animate-pulse flex gap-1"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full delay-75"></span><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full delay-150"></span></span>
                                  </span>
                              ) : (results.length > 0 ? `Results for "${searchTerm}"` : `No results for "${searchTerm}"`)}
                          </h1>
                      </div>

                      {server1Results.length > 0 && (
                          <ResultsGrid title="Cloud Server 1 (Ultra Fast)" items={server1Results} color="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                      )}

                      {server2Results.length > 0 && (
                          <>
                             {server1Results.length > 0 && <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-10 md:my-12"></div>}
                             <ResultsGrid title="Cloud Server 2 (Premium Quality)" items={server2Results} color="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                          </>
                      )}

                      {loading && !results.length && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mt-8">
                             {[1,2,3,4,5,6,7,8,9,10].map(i => (
                                 <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-2xl md:rounded-[2rem] border border-white/5"></div>
                             ))}
                          </div>
                      )}

                      {!loading && searchTerm && results.length === 0 && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 md:py-20 text-center space-y-4 md:space-y-6">
                              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                 <Search size={32} className="text-gray-500 md:w-10 md:h-10" />
                              </div>
                              <div>
                                 <h2 className="text-xl md:text-3xl font-bold text-white mb-2">Universe Scanned</h2>
                                 <p className="text-sm md:text-base text-gray-500 max-w-md px-4">We couldn't find anything matching your search. Try different keywords or check for typos.</p>
                              </div>
                          </motion.div>
                      )}
                  </motion.div>
              )}
          </AnimatePresence>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#050505] flex items-center justify-center text-white"><Loader2 className="animate-spin text-yellow-500" size={40}/></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
