// app/page.tsx
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Play, Info, Search, Bell, CloudLightning, 
  ChevronRight, Star, Loader2, X 
} from 'lucide-react';

// --- Components ---
function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL se search query uthao (Refresh karne par bhi search rahega)
  const initialQuery = searchParams.get('search') || '';

  // --- States ---
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Home Data States
  const [homeData, setHomeData] = useState<any>(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Debounce Timers
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- 1. LOAD HOME DATA (Initial) ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Agar URL me search nahi hai, to Home Data lao
    if (!initialQuery) {
        fetch('/api/home')
          .then(res => res.json())
          .then(res => {
             if(res.success) setHomeData(res.data);
             setLoadingHome(false);
          });
    } else {
        // Agar URL me search hai, to direct search karo
        performSearch(initialQuery);
        setLoadingHome(false);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 2. SEARCH HANDLERS (NetVlyx Logic) ---
  
  // A. Type Handler
  const handleSearchInput = (text: string) => {
    setQuery(text);
    
    // 1. Update URL (without reload)
    const params = new URLSearchParams(window.location.search);
    if (text) {
        params.set('search', text);
    } else {
        params.delete('search');
        setSearchResults([]); // Clear results if empty
    }
    router.replace(`/?${params.toString()}`, { scroll: false });

    // 2. Fetch TMDB Suggestions (Live)
    if (text.length > 2) {
        fetch(`https://api.themoviedb.org/3/search/multi?api_key=848d4c9db9d3f19d0229dc95735190d3&query=${encodeURIComponent(text)}`)
           .then(res => res.json())
           .then(data => {
               const names = data.results?.slice(0, 5).map((item: any) => item.title || item.name) || [];
               setSuggestions(names);
               setShowSuggestions(true);
           });
    } else {
        setShowSuggestions(false);
    }

    // 3. Debounced Main Search (300ms delay like NetVlyx)
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
        if (text) performSearch(text);
    }, 500);
  };

  // B. Main Search Executor (Calls our Proxy)
  const performSearch = async (text: string) => {
      setIsSearching(true);
      setShowSuggestions(false);
      try {
          const res = await fetch(`/api/search?s=${encodeURIComponent(text)}`);
          const data = await res.json();
          if (data.success) {
              setSearchResults(data.results);
          }
      } catch (e) {
          console.error("Search Failed", e);
      } finally {
          setIsSearching(false);
      }
  };

  const clearSearch = () => {
      setQuery('');
      setSearchResults([]);
      setShowSuggestions(false);
      router.replace('/', { scroll: false });
      // Reload home data if missing
      if (!homeData) window.location.reload(); 
  };

  const openLink = (link: string) => {
    if (!link) return;
    const encoded = btoa(link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/v/${encoded}`);
  };

  // Auto Slider for Home
  useEffect(() => {
    if (!homeData?.hero?.length || query) return;
    const interval = setInterval(() => {
        setHeroIndex((prev) => (prev + 1) % homeData.hero.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [homeData, query]);


  // --- RENDER ---
  const activeHero = homeData?.hero?.[heroIndex];
  const isSearchMode = query.length > 0; // Toggle UI based on this

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500/30 pb-20">
      
      {/* --- NAVBAR WITH SEARCH --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 px-4 md:px-12 py-4 flex items-center justify-between ${scrolled || isSearchMode ? 'bg-black/95 backdrop-blur-md border-b border-gray-800' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
         
         {/* Logo (Hidden on mobile search) */}
         <div className={`flex items-center gap-8 ${isSearchMode ? 'hidden md:flex' : 'flex'}`}>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 tracking-tighter cursor-pointer flex items-center gap-1" onClick={() => { clearSearch(); window.scrollTo(0,0); }}>
               <CloudLightning className="text-red-600 fill-current" size={24}/> NETVLYX
            </h1>
         </div>

         {/* Search Bar (Center) */}
         <div className={`flex-1 max-w-2xl mx-auto relative transition-all duration-500 ${isSearchMode ? 'w-full' : 'w-auto'}`}>
             <div className={`relative flex items-center bg-gray-900/80 border ${isSearchMode ? 'border-red-600/50 shadow-red-900/20 shadow-lg' : 'border-gray-700'} rounded-full px-4 py-2 transition-all`}>
                 <Search className={`w-5 h-5 ${isSearchMode ? 'text-red-500' : 'text-gray-400'}`} />
                 <input 
                    type="text" 
                    value={query}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder="Search movies, shows..."
                    className="bg-transparent border-none outline-none text-white px-3 py-1 w-full placeholder-gray-500"
                 />
                 {query && (
                     <button onClick={clearSearch}>
                         <X className="w-5 h-5 text-gray-400 hover:text-white transition" />
                     </button>
                 )}
             </div>

             {/* Suggestions Dropdown */}
             {showSuggestions && suggestions.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                     {suggestions.map((s, i) => (
                         <div 
                            key={i} 
                            onClick={() => handleSearchInput(s)}
                            className="px-4 py-3 hover:bg-gray-800 cursor-pointer text-gray-300 hover:text-white flex items-center gap-3 border-b border-gray-800 last:border-none"
                         >
                             <Search size={14} /> {s}
                         </div>
                     ))}
                 </div>
             )}
         </div>

         {/* Right Icons */}
         <div className="hidden md:flex items-center gap-5 text-gray-300 ml-4">
            <Bell className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-xs text-white shadow-lg">U</div>
         </div>
      </nav>

      {/* --- MAIN CONTENT SWITCHER --- */}
      
      {/* 1. SEARCH RESULTS GRID (Shows when searching) */}
      {isSearchMode && (
          <div className="pt-28 px-4 md:px-12 min-h-screen">
              <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                  {isSearching ? <Loader2 className="animate-spin text-red-500"/> : 'Search Results'}
                  <span className="text-sm font-normal text-gray-500">
                      {isSearching ? 'Searching...' : `Found ${searchResults.length} items`}
                  </span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                  {searchResults.map((item, idx) => (
                      <div 
                          key={idx} 
                          onClick={() => openLink(item.link)}
                          className="group relative cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10"
                      >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 relative border border-gray-700 group-hover:border-red-500/50 shadow-lg">
                              <img 
                                  src={item.image} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:contrast-110" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                              
                              <div className="absolute bottom-0 p-3 w-full">
                                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                                      {item.title}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-300">
                                      <span className="bg-white/20 px-1.5 rounded">{item.quality?.[0] || 'HD'}</span>
                                      <span>{item.year || '2024'}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              {!isSearching && searchResults.length === 0 && (
                  <div className="text-center py-20 text-gray-500">
                      <p>No results found for "{query}"</p>
                  </div>
              )}
          </div>
      )}

      {/* 2. HOME PAGE (Shows when NOT searching) */}
      {!isSearchMode && !loadingHome && homeData && (
         <>
            {/* Hero Slider */}
            {activeHero && (
                <div className="relative w-full h-[85vh] group">
                    <div className="absolute inset-0">
                        <div className="w-full h-full bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${activeHero.poster})` }}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/10 to-transparent"></div>
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-4 md:px-12 max-w-3xl">
                        <h1 className="text-4xl md:text-7xl font-black mb-4 text-white drop-shadow-2xl animate-slide-up">{activeHero.title}</h1>
                        <p className="text-gray-200 mb-8 line-clamp-3 animate-slide-up delay-100">{activeHero.desc}</p>
                        <div className="flex gap-4 animate-slide-up delay-200">
                            <button onClick={() => handleSearchInput(activeHero.title)} className="bg-white text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"><Play className="fill-current" size={24}/> Play</button>
                            <button className="bg-gray-600/40 text-white px-8 py-3 rounded-lg font-bold backdrop-blur-md"><Info size={24}/> Info</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Sections */}
            <div className="relative z-20 -mt-20 space-y-12 px-4 md:px-12 pb-12">
                {homeData.sections?.map((section: any, idx: number) => (
                    section.items?.length > 0 && (
                        <div key={idx}>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-red-600 pl-3">{section.title}</h2>
                            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                                {section.items.map((item: any, i: number) => (
                                    <div key={i} onClick={() => openLink(item.link)} className="flex-shrink-0 w-[140px] md:w-[200px] cursor-pointer hover:scale-105 transition-transform">
                                        <div className="aspect-[2/3] rounded-lg overflow-hidden relative">
                                            <img src={item.poster || item.image} className="w-full h-full object-cover" loading="lazy"/>
                                            <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors"></div>
                                        </div>
                                        <h3 className="mt-2 text-sm text-gray-300 truncate hover:text-white">{item.title}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
         </>
      )}

      {/* Loading State */}
      {loadingHome && !isSearchMode && (
          <div className="h-screen flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-red-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
      )}

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
