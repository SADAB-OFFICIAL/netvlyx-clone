'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Play, Info, Search, Bell, MonitorPlay, 
  ChevronRight, Star, Loader2, X, 
  Globe, Mail, Instagram 
} from 'lucide-react';

// --- SKELETON COMPONENTS ---
const HeroSkeleton = () => (
  <div className="w-full h-[85vh] bg-gray-900/50 animate-pulse relative">
      <div className="absolute bottom-0 left-0 p-12 w-full max-w-3xl space-y-4">
          <div className="h-12 w-3/4 bg-gray-800 rounded-lg"></div>
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
  <div className="px-12 mb-12 space-y-4">
      <div className="h-6 w-48 bg-gray-800 rounded animate-pulse"></div>
      <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[200px] h-[300px] bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
      </div>
  </div>
);

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('search') || '';

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [homeData, setHomeData] = useState<any>(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  
  // Ref for the Search Bar to trigger SVG animations
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    if (!initialQuery) {
        fetch('/api/home').then(res => res.json()).then(res => {
             if(res.success) setHomeData(res.data);
             setLoadingHome(false);
        });
    } else {
        performSearch(initialQuery);
        setLoadingHome(false);
    }
   
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchInput = (text: string) => {
    setQuery(text);
    const params = new URLSearchParams(window.location.search);
    if (text) params.set('search', text); else { params.delete('search'); setSearchResults([]); }
    router.replace(`/?${params.toString()}`, { scroll: false });

    if (text.length > 2) {
        fetch(`https://api.themoviedb.org/3/search/multi?api_key=848d4c9db9d3f19d0229dc95735190d3&query=${encodeURIComponent(text)}`)
           .then(res => res.json())
           .then(data => {
               const names = data.results?.slice(0, 5).map((item: any) => item.title || item.name) || [];
               setSuggestions(names); setShowSuggestions(true);
           });
    } else { setShowSuggestions(false); }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { if (text) performSearch(text); }, 500);
  };

  const performSearch = async (text: string) => {
      setIsSearching(true); setShowSuggestions(false);
      try {
          const res = await fetch(`/api/search?s=${encodeURIComponent(text)}`);
          const data = await res.json();
          if (data.success) setSearchResults(data.results);
      } catch (e) { console.error("Search Failed", e); } 
      finally { setIsSearching(false); }
  };

  const clearSearch = () => {
      setQuery(''); setSearchResults([]); setShowSuggestions(false);
      router.replace('/', { scroll: false });
      if (!homeData) window.location.reload(); 
  };

  const openLink = (link: string) => {
    if (!link) return;
    const encoded = btoa(link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/v/${encoded}`);
  };

  useEffect(() => {
    if (!homeData?.hero?.length || query) return;
    const interval = setInterval(() => { setHeroIndex((prev) => (prev + 1) % homeData.hero.length); }, 6000);
    return () => clearInterval(interval);
  }, [homeData, query]);

  const activeHero = homeData?.hero?.[heroIndex];
  const isSearchMode = query.length > 0;

// ... (pichle code ke aage se)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500/30">
      
      {/* SVG FILTER (For Glassy Effect) */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="frosted">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
        </filter>
      </svg>

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 px-6 py-4 flex justify-between items-center ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-gradient-to-b from-black/70 to-transparent'}`}>
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 cursor-pointer" onClick={clearSearch}>
            GLASSY
          </h1>
        </div>

        {/* SEARCH BAR */}
        <div className="relative flex-1 max-w-md mx-8 group">
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 focus-within:bg-white/10 focus-within:border-white/30 transition-all duration-300">
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-white" />
            <input 
              type="text"
              value={query}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search movies, series..."
              className="bg-transparent border-none outline-none px-3 w-full text-sm placeholder:text-gray-500"
            />
            {query && <X className="w-4 h-4 cursor-pointer hover:text-red-400" onClick={clearSearch} />}
          </div>
          
          {/* SUGGESTIONS */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-black/90 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
              {suggestions.map((s, i) => (
                <div key={i} className="px-4 py-3 hover:bg-white/10 cursor-pointer text-sm border-b border-white/5 last:border-none" onClick={() => { setQuery(s); performSearch(s); }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-gray-300">
          <Bell className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 border border-white/20"></div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="relative">
        {isSearchMode ? (
          /* SEARCH RESULTS VIEW */
          <div className="pt-32 px-12 pb-20">
            <h2 className="text-2xl font-medium mb-8 flex items-center gap-3">
              Results for: <span className="text-yellow-500">{query}</span>
              {isSearching && <Loader2 className="w-5 h-5 animate-spin text-gray-500" />}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {searchResults.map((item, idx) => (
                <div 
                  key={idx} 
                  className="group relative rounded-xl overflow-hidden cursor-pointer bg-white/5 hover:scale-105 transition-transform duration-500"
                  onClick={() => openLink(item.link)}
                >
                  <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover group-hover:opacity-50 transition-opacity" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black via-black/40 to-transparent">
                    <p className="text-sm font-bold truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs text-yellow-500">{item.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* HOME PAGE HERO & SECTIONS */
          <>
            {/* HERO SECTION */}
            <section className="relative h-[90vh] w-full overflow-hidden">
              <div className="absolute inset-0 transition-all duration-1000 transform scale-105">
                <img 
                    src={activeHero?.banner} 
                    alt="Hero" 
                    className="w-full h-full object-cover brightness-50"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent"></div>
              </div>

              <div className="absolute bottom-0 left-0 p-12 w-full max-w-4xl space-y-6">
                <div className="flex items-center gap-3 animate-fade-in">
                    <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold tracking-widest uppercase">New Release</span>
                    <span className="text-gray-400 text-sm">{activeHero?.year}</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase drop-shadow-2xl">
                  {activeHero?.title}
                </h1>
                <p className="text-lg text-gray-300 max-w-2xl line-clamp-3 leading-relaxed">
                  {activeHero?.description}
                </p>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => openLink(activeHero?.link)}
                    className="bg-white text-black px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-current" /> Play Now
                  </button>
                  <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-white/20 transition-all duration-300">
                    <Info className="w-5 h-5" /> More Info
                  </button>
                </div>
              </div>

              {/* HERO INDICATORS */}
              <div className="absolute bottom-12 right-12 flex gap-3">
                {homeData?.hero?.map((_: any, i: number) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-500 ${i === heroIndex ? 'w-12 bg-yellow-500' : 'w-4 bg-white/30'}`}
                  />
                ))}
              </div>
            </section>

            {/* CONTENT SECTIONS */}
            <div className="relative z-10 -mt-20 space-y-16 pb-32">
              {homeData?.sections?.map((section: any, idx: number) => (
                <div key={idx} className="px-12 group">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold tracking-tight group-hover:text-yellow-500 transition-colors flex items-center gap-2">
                      {section.title} <ChevronRight className="w-5 h-5" />
                    </h3>
                  </div>
                  <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 scroll-smooth">
                    {section.items.map((item: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex-shrink-0 w-[200px] h-[300px] rounded-2xl overflow-hidden relative cursor-pointer hover:scale-105 transition-transform duration-500 group/card"
                        onClick={() => openLink(item.link)}
                      >
                        <img src={item.poster} alt="" className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col justify-center items-center p-4 text-center backdrop-blur-sm">
                          <Play className="w-10 h-10 mb-3 text-yellow-500 fill-current" />
                          <p className="text-sm font-bold uppercase tracking-wider">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-black/40 py-20 px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <div className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tighter">GLASSY</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                      Experience premium streaming with a glass-morphic touch. Only the best for your eyes.
                  </p>
                  <div className="flex gap-4 pt-4">
                      <Instagram className="w-5 h-5 text-gray-500 hover:text-pink-500 cursor-pointer" />
                      <Mail className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer" />
                      <Globe className="w-5 h-5 text-gray-500 hover:text-blue-400 cursor-pointer" />
                  </div>
              </div>
              <div className="space-y-4">
                  <h4 className="font-bold">Navigation</h4>
                  <ul className="text-gray-500 space-y-2 text-sm">
                      <li className="hover:text-white cursor-pointer">Movies</li>
                      <li className="hover:text-white cursor-pointer">Series</li>
                      <li className="hover:text-white cursor-pointer">Originals</li>
                  </ul>
              </div>
              <div className="space-y-4 text-gray-500 text-xs">
                  <p>© 2025 Glassy Inc. All rights reserved.</p>
                  <p>Design by AI Thought Partner</p>
              </div>
          </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" /></div>}>
      <HomePageContent />
    </Suspense>
  );
}
