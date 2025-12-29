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

  // --- AAPKA ORIGINAL LOGIC (NO CHANGES) ---
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [homeData, setHomeData] = useState<any>(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

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

  // --- SKELETON LOADING STATE ---
  if (loadingHome && !isSearchMode) {
      return (
          <div className="min-h-screen bg-[#0a0a0a]">
              <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center bg-black/50 backdrop-blur-md">
                  <div className="h-8 w-32 bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-10 w-64 bg-gray-800 rounded-full animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-800 rounded-full animate-pulse"></div>
              </nav>
              <HeroSkeleton />
              <div className="mt-8"><SectionSkeleton /><SectionSkeleton /></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500/30">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-all duration-500 ${scrolled || isSearchMode ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center gap-2 cursor-pointer text-yellow-500" onClick={clearSearch}>
            <MonitorPlay size={28} />
            <h1 className="text-xl font-black tracking-tighter text-white">SADABEFY</h1>
        </div>

        {/* UPDATED SEARCH BAR */}
        <div className="relative flex-1 max-w-md mx-8 group">
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-5 py-2.5 focus-within:bg-white/10 focus-within:border-yellow-500/50 transition-all shadow-lg">
            <Search className={`w-4 h-4 ${isSearchMode ? 'text-yellow-500' : 'text-gray-400'}`} />
            <input 
              type="text"
              value={query}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search movies, series..."
              className="bg-transparent border-none outline-none px-3 w-full text-sm placeholder:text-gray-500"
            />
            {query && <X className="w-4 h-4 cursor-pointer hover:text-red-400" onClick={clearSearch} />}
          </div>
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[100]">
              {suggestions.map((s, i) => (
                <div key={i} className="px-4 py-3 hover:bg-yellow-500 hover:text-black cursor-pointer text-sm border-b border-white/5 last:border-none transition-colors" onClick={() => { setQuery(s); performSearch(s); }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Bell className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-black shadow-lg">S</div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main>
        {isSearchMode ? (
          /* SEARCH RESULTS */
          <div className="pt-32 px-12 pb-20 min-h-screen">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              {isSearching ? <Loader2 className="animate-spin text-yellow-500" /> : <Search className="text-yellow-500" />}
              Results for: <span className="text-yellow-500">{query}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {searchResults.map((item, idx) => (
                <div key={idx} className="group relative rounded-xl overflow-hidden cursor-pointer bg-white/5 hover:scale-105 transition-all duration-300 border border-white/5 hover:border-yellow-500/50 shadow-xl" onClick={() => openLink(item.link)}>
                  <img src={item.image || item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm font-bold truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs text-yellow-500">{item.rating || '8.5'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* HOME PAGE */
          <>
            <section className="relative h-[85vh] w-full flex items-end overflow-hidden">
                <img src={activeHero?.poster} className="absolute inset-0 w-full h-full object-cover brightness-[0.4] transition-all duration-1000 scale-105" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent"></div>
                <div className="relative z-10 p-12 w-full max-w-4xl space-y-6 mb-10">
                    <div className="flex items-center gap-3">
                        <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Trending</span>
                        <span className="text-gray-400 text-sm">{activeHero?.year || '2024'}</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter drop-shadow-2xl">{activeHero?.title}</h1>
                    <p className="text-lg text-gray-300 line-clamp-2 max-w-2xl">{activeHero?.desc}</p>
                    <div className="flex gap-4 pt-2">
                        <button onClick={() => openLink(activeHero?.link)} className="bg-white text-black px-10 py-4 rounded-xl font-black flex items-center gap-2 hover:bg-yellow-500 transition-all hover:scale-105 shadow-2xl">
                            <Play className="fill-black" /> PLAY NOW
                        </button>
                        <button className="bg-white/10 backdrop-blur-md px-10 py-4 rounded-xl font-bold flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-all">
                            <Info /> DETAILS
                        </button>
                    </div>
                </div>
            </section>

            <div className="relative z-20 -mt-24 pb-32 space-y-16">
              {homeData?.sections?.map((section: any, idx: number) => (
                <div key={idx} className="px-12 group">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2 group-hover:text-yellow-500 transition-colors">
                    <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                    {section.title} <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                  </h3>
                  <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4">
                    {section.items.map((item: any, i: number) => (
                      <div key={i} className="flex-shrink-0 w-[180px] md:w-[220px] rounded-2xl overflow-hidden relative group/card cursor-pointer hover:scale-105 transition-all duration-500 shadow-lg border border-white/5 hover:border-yellow-500/30" onClick={() => openLink(item.link)}>
                        <img src={item.poster || item.image} className="w-full h-full object-cover aspect-[2/3]" alt="" loading="lazy" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-all flex flex-col justify-center items-center p-4 text-center backdrop-blur-[2px]">
                           <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-3 shadow-2xl">
                              <Play className="text-black fill-black ml-1" size={24} />
                           </div>
                           <p className="text-sm font-bold uppercase tracking-tight">{item.title}</p>
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
      <footer className="bg-black border-t border-white/5 py-20 px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="space-y-6">
                  <h2 className="text-2xl font-black text-yellow-500">SADABEFY</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">Your premium destination for exploring the best content online. Discover, search, and stream effortlessly.</p>
                  <div className="flex gap-5">
                      <Instagram className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
                      <Mail className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
                      <Globe className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
                  </div>
              </div>
              <div className="space-y-4">
                  <h4 className="font-bold text-white">Links</h4>
                  <ul className="text-gray-500 space-y-2 text-sm">
                      <li className="hover:text-yellow-500 cursor-pointer transition-colors">Movies</li>
                      <li className="hover:text-yellow-500 cursor-pointer transition-colors">Web Series</li>
                      <li className="hover:text-yellow-500 cursor-pointer transition-colors">Korean Drama</li>
                  </ul>
              </div>
              <div className="space-y-4">
                  <h4 className="font-bold text-white">Support</h4>
                  <ul className="text-gray-500 space-y-2 text-sm">
                      <li className="hover:text-yellow-500 cursor-pointer transition-colors">DMCA</li>
                      <li className="hover:text-yellow-500 cursor-pointer transition-colors">Privacy Policy</li>
                      <li className="hover:text-yellow-500 cursor-pointer transition-colors">Contact Us</li>
                  </ul>
              </div>
              <div className="space-y-4">
                  <p className="text-xs text-gray-600">© 2025 Sadabefy. Built with precision for the best user experience.</p>
                  <div className="text-xs text-gray-700">Disclaimer: This site does not host files on its server. All contents are provided by non-affiliated third parties.</div>
              </div>
          </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={40} /></div>}>
      <HomePageContent />
    </Suspense>
  );
}
