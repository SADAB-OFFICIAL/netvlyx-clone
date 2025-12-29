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

  // --- LOGIC (Aapka Original Logic) ---
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

  // --- UI RENDERING ---
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
      <nav className={`fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : 'bg-gradient-to-b from-black/70 to-transparent'}`}>
        <h1 className="text-2xl font-black tracking-tighter cursor-pointer" onClick={clearSearch}>GLASSY</h1>

        {/* SEARCH BAR (Logic Linked) */}
        <div className="relative flex-1 max-w-md mx-8 group">
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 focus-within:bg-white/10 focus-within:border-white/30 transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text"
              value={query}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search movies, series..."
              className="bg-transparent border-none outline-none px-3 w-full text-sm"
            />
            {query && <X className="w-4 h-4 cursor-pointer hover:text-red-400" onClick={clearSearch} />}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-black/90 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
              {suggestions.map((s, i) => (
                <div key={i} className="px-4 py-3 hover:bg-white/10 cursor-pointer text-sm" onClick={() => { setQuery(s); performSearch(s); }}>{s}</div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6"><Bell className="w-5 h-5" /><div className="w-8 h-8 rounded-full bg-yellow-500"></div></div>
      </nav>

      {/* MAIN CONTENT */}
      <main>
        {isSearchMode ? (
          <div className="pt-32 px-12 pb-20">
            <h2 className="text-2xl font-medium mb-8">Results for: <span className="text-yellow-500">{query}</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {searchResults.map((item, idx) => (
                <div key={idx} className="group relative rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all" onClick={() => openLink(item.link)}>
                  <img src={item.poster} alt="" className="w-full aspect-[2/3] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm font-bold truncate">{item.title}</p>
                    <p className="text-xs text-yellow-500">★ {item.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* HERO */}
            <section className="relative h-[85vh] w-full flex items-end p-12 overflow-hidden">
                <img src={activeHero?.banner} className="absolute inset-0 w-full h-full object-cover brightness-50 transition-all duration-1000" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent"></div>
                <div className="relative z-10 max-w-3xl space-y-6">
                    <h1 className="text-6xl font-black uppercase tracking-tighter">{activeHero?.title}</h1>
                    <p className="text-lg text-gray-300 line-clamp-3">{activeHero?.description}</p>
                    <div className="flex gap-4">
                        <button onClick={() => openLink(activeHero?.link)} className="bg-white text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-500 transition-colors"><Play className="fill-black" /> Play</button>
                        <button className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-lg font-bold flex items-center gap-2"><Info /> Info</button>
                    </div>
                </div>
            </section>

            {/* ROWS */}
            <div className="relative z-10 -mt-20 pb-20 space-y-12">
              {homeData?.sections?.map((section: any, idx: number) => (
                <div key={idx} className="px-12">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">{section.title} <ChevronRight className="w-5 h-5" /></h3>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                    {section.items.map((item: any, i: number) => (
                      <div key={i} className="flex-shrink-0 w-[200px] h-[300px] rounded-xl overflow-hidden relative group cursor-pointer" onClick={() => openLink(item.link)}>
                        <img src={item.poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                           <Play className="w-12 h-12 text-yellow-500 fill-current" />
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
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
