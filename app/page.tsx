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

  // --- SKELETON LOADER STATE ---
  if (loadingHome && !isSearchMode) {
      return (
          <div className="min-h-screen bg-[#0a0a0a]">
              <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                  <div className="h-8 w-32 bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-800 rounded-full animate-pulse"></div>
              </nav>
              <HeroSkeleton />
              <div className="mt-8">
                  <SectionSkeleton />
                  <SectionSkeleton />
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500/30">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 px-4 md:px-12 py-4 flex items-center justify-between ${scrolled || isSearchMode ? 'bg-black/95 backdrop-blur-md border-b border-gray-800' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
         <div className={`flex items-center gap-8 ${isSearchMode ? 'hidden md:flex' : 'flex'}`}>
            {/* LOGO: Small, Premium Gold */}
            <h1 className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 tracking-wide cursor-pointer flex items-center gap-2 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)]" onClick={() => { clearSearch(); window.scrollTo(0,0); }}>
                <MonitorPlay className="text-yellow-500" size={24} strokeWidth={2.5}/> 
                SADABEFY 
            </h1>
         </div>
         
         <div className={`flex-1 max-w-2xl mx-auto relative transition-all duration-500 ${isSearchMode ? 'w-full' : 'w-auto'}`}>
             
             {/* LIQUID GLASS SEARCH BAR */}
             {/* bg-white/5 -> Very sheer background (glass tint)
                 backdrop-blur-2xl -> Heavy blur behind the element (frosted glass)
                 border-white/10 -> Subtle border
                 shadow-[inset_...] -> Top inner highlight for 3D glass effect
             */}
             <div className={`
                relative flex items-center rounded-full px-5 py-2.5 transition-all duration-300
                backdrop-blur-2xl border
                ${isSearchMode 
                    ? 'bg-black/60 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] shadow-lg'
                }
             `}>
                 <Search className={`w-4 h-4 ${isSearchMode ? 'text-yellow-500' : 'text-gray-400'}`} />
                 <input 
                    type="text" 
                    value={query} 
                    onChange={(e) => handleSearchInput(e.target.value)} 
                    placeholder="Search movies, shows..." 
                    className="bg-transparent border-none outline-none text-white text-sm px-3 py-1 w-full placeholder-gray-400 focus:placeholder-gray-500"
                 />
                 {query && <button onClick={clearSearch}><X className="w-4 h-4 text-gray-400 hover:text-white transition" /></button>}
             </div>

             {showSuggestions && suggestions.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                     {suggestions.map((s, i) => (<div key={i} onClick={() => handleSearchInput(s)} className="px-4 py-3 hover:bg-white/5 cursor-pointer text-gray-300 hover:text-white flex items-center gap-3 border-b border-gray-800 last:border-none text-sm"><Search size={12} /> {s}</div>))}
                 </div>
             )}
         </div>

         <div className="hidden md:flex items-center gap-5 text-gray-300 ml-4">
            <Bell className="w-5 h-5 cursor-pointer hover:text-yellow-500 transition" />
            <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center font-bold text-xs text-black shadow-lg">S</div>
         </div>
      </nav>

      {isSearchMode && (
          <div className="pt-28 px-4 md:px-12 min-h-screen">
              <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">{isSearching ? <Loader2 className="animate-spin text-yellow-500"/> : 'Search Results'} <span className="text-sm font-normal text-gray-500">{isSearching ? 'Searching...' : `Found ${searchResults.length} items`}</span></h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                  {searchResults.map((item, idx) => (
                      <div key={idx} onClick={() => openLink(item.link)} className="group relative cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10">
                          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 relative border border-gray-700 group-hover:border-yellow-500/50 shadow-lg">
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:contrast-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                              <div className="absolute bottom-0 p-3 w-full">
                                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-yellow-400 transition-colors">{item.title}</h3>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-300"><span className="bg-white/20 px-1.5 rounded">{item.quality?.[0] || 'HD'}</span><span>{item.year || '2024'}</span></div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {!isSearchMode && !loadingHome && homeData && (
         <>
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
                            <button className="bg-gray-600/40 text-white px-8 py-3 rounded-lg font-bold backdrop-blur-md hover:bg-gray-600/60 transition"><Info size={24}/> Info</button>
                        </div>
                    </div>
                </div>
            )}
           
            <div className="relative z-20 -mt-20 space-y-12 px-4 md:px-12 pb-12">
                {homeData.sections?.map((section: any, idx: number) => (
                    section.items?.length > 0 && (
                        <div key={idx}>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-yellow-600 pl-3">{section.title}</h2>
                            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                                {section.items.map((item: any, i: number) => (
                                    <div key={i} onClick={() => openLink(item.link)} className="flex-shrink-0 w-[140px] md:w-[200px] cursor-pointer hover:scale-105 transition-transform">
                                        <div className="aspect-[2/3] rounded-lg overflow-hidden relative">
                                            <img src={item.poster || item.image} className="w-full h-full object-cover" loading="lazy"/>
                                            <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors"></div>
                                        </div>
                                        <h3 className="mt-2 text-sm text-gray-300 truncate hover:text-white group-hover:text-yellow-400 transition-colors">{item.title}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
         </>
      )}

      {/* FOOTER SECTION (Gold Theme) */}
      <footer className="bg-[#050505] border-t border-gray-900 pt-16 pb-8 px-4 md:px-12 mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              {/* Brand Column */}
              <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                      <MonitorPlay size={24} className="text-yellow-500"/> SADABEFY
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                      Your premium entertainment destination. We help you discover content from across the internet. No content is hosted on our platform.
                  </p>
                  <button className="text-yellow-500 font-bold text-sm hover:underline">Learn More About Us ?</button>
              </div>

              {/* Quick Links */}
              <div>
                  <h3 className="text-white font-bold mb-6">Quick Links</h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                      {['Bollywood Movies', 'South Movies', 'Korean Content', 'Anime', 'Action Movies'].map((item) => (
                          <li key={item}><a href="#" className="hover:text-yellow-500 transition-colors">{item}</a></li>
                      ))}
                  </ul>
              </div>

              {/* Legal & Support */}
              <div>
                  <h3 className="text-white font-bold mb-6">Legal & Support</h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                      {['About Us', 'Contact Us', 'DMCA Policy', 'Privacy Policy', 'Terms of Service'].map((item) => (
                          <li key={item}><a href="#" className="hover:text-yellow-500 transition-colors">{item}</a></li>
                      ))}
                  </ul>
              </div>

              {/* Get in Touch */}
              <div>
                  <h3 className="text-white font-bold mb-6">Get in Touch</h3>
                  <ul className="space-y-4 text-sm">
                      <li className="flex items-center gap-3 text-gray-400">
                          <Globe size={18} className="text-blue-500"/> 
                          <span className="hover:text-white cursor-pointer">sadabefy.vercel.app</span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-400">
                          <Mail size={18} className="text-yellow-500"/> 
                          <span className="hover:text-white cursor-pointer">contact@sadabefy.com</span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-400">
                          <Instagram size={18} className="text-purple-500"/> 
                          <span className="hover:text-white cursor-pointer">@sadab_official</span>
                      </li>
                  </ul>
              </div>
          </div>

          <div className="border-t border-gray-900 pt-8 mt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-500 text-sm">
                  <p className="mb-1">Developed & Managed By</p>
                  <h4 className="text-lg font-bold text-yellow-500">Sadab Codes</h4>
                  <p className="text-xs">Professional Web Development</p>
              </div>
              
              <div className="text-gray-600 text-xs text-center md:text-right max-w-md">
                  <p className="mb-2">© 2025 Sadabefy. All rights reserved.</p>
                  <p>Disclaimer: Sadabefy does not host any content. We only index and provide links to content that is publicly available on the internet.</p>
              </div>
          </div>
      </footer>
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
