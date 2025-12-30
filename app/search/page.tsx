'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Play, Search, MonitorPlay, ChevronLeft, Star, Loader2, X, Zap, Film, Layers 
} from 'lucide-react';
import TwinklingStars from '@/components/TwinklingStars';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- LIVE SEARCH LOGIC ---
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
            console.error("Live Search Error:", error);
        } finally {
            setLoading(false);
        }
    }, 600); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleItemClick = (item: any) => {
      if (item.link) {
          const encodedLink = btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
          router.push(`/v/${encodedLink}`);
      }
  };

  // --- HELPER 1: Dynamic Rating ---
  const getDynamicRating = (title: string) => {
      let hash = 0;
      for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
      return (Math.abs(hash % 30) / 10 + 6.5).toFixed(1);
  };

  // --- HELPER 2: Year Extraction ---
  const getYearFromTitle = (title: string) => {
      const match = title.match(/\((\d{4})\)/);
      return match ? match[1] : '2024';
  };

  // --- HELPER 3: ADVANCED SEASON BADGE LOGIC 🧠 ---
  const getSeasonBadge = (title: string, type: string) => {
      if (!type || type !== 'Series') return null;

      const t = title.toLowerCase();

      // 1. MULTI SEASON PATTERNS (Strongest Check)
      // Examples: "Season 1-5", "S01-S03", "Season 1, 2", "Complete Series", "All Seasons"
      const multiPatterns = [
        /season\s*\d+\s*[-–to&]\s*\d+/i,    // Range: Season 1-5, Season 1 to 5
        /s\d+\s*[-–to&]\s*s\d+/i,           // Range: S01-S05
        /seasons\s+\d+/i,                   // Plural: Seasons 1...
        /complete\s+series/i,               // Complete Series
        /all\s+seasons/i,                   // All Seasons
        /season\s*\d+(?:\s*,\s*\d+)+/i,     // Comma List: Season 1, 2
        /series\s+pack/i                    // Series Pack
      ];

      if (multiPatterns.some(p => p.test(t))) return 'Multi (s)';

      // 2. SINGLE SEASON PATTERNS (Specific Check)
      // Examples: "Season 5", "S05", "3rd Season"
      // Note: Hum check karte hain ki iske aage dash (-) na ho taaki "Season 1-5" galti se catch na ho
      const singlePatterns = [
        /season\s*\d+(?!\s*[-–])/i,         // Season 4 (Not followed by -)
        /s\d+(?!\s*[-–])/i,                 // S04 (Not followed by -)
        /series\s*\d+/i,                    // Series 4
        /\d+(?:st|nd|rd|th)\s*season/i      // 1st Season
      ];

      if (singlePatterns.some(p => p.test(t))) return 'Single (s)';

      // 3. FALLBACK: Agar Title me season number nahi hai par wo Series hai
      // Example: "Stranger Things" (Implies Main Series Page -> Multi)
      return 'Multi (s)';
  };

  return (
    <div className="min-h-screen relative bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      
      <TwinklingStars />
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10">
        
        {/* --- HEADER --- */}
        <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
            <div className="px-4 md:px-12 py-4 flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1920px] mx-auto">
                <div className="flex items-center justify-between w-full md:w-auto gap-6">
                    <button onClick={() => router.push('/')} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <div className="p-2 bg-white/5 rounded-full group-hover:bg-yellow-500/20 border border-transparent group-hover:border-yellow-500/30 transition-all">
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <span className="hidden md:block font-medium text-sm tracking-wide">Back</span>
                    </button>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <MonitorPlay className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" size={28} />
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 tracking-tight drop-shadow-sm">
                            SADABEFY
                        </span>
                    </div>
                </div>

                <div className="relative w-full max-w-2xl group">
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-yellow-600 to-purple-600 opacity-0 group-focus-within:opacity-30 transition duration-500 blur-md"></div>
                    <div className="relative flex items-center bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-3 shadow-inner group-focus-within:border-yellow-500/50 group-focus-within:bg-black/80 transition-all">
                        {loading ? (
                            <Loader2 className="text-yellow-500 animate-spin" size={20} />
                        ) : (
                            <Search className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
                        )}
                        <input 
                          type="text" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Type to search (e.g. Stranger Things)..." 
                          className="w-full bg-transparent border-none outline-none text-white ml-3 placeholder-gray-500 font-medium text-sm md:text-base"
                          autoFocus
                        />
                        {searchTerm && (
                            <button type="button" onClick={() => setSearchTerm('')}>
                                <X size={18} className="text-gray-500 hover:text-white transition-colors" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- RESULTS AREA --- */}
        <div className="p-4 md:p-12 min-h-[85vh] max-w-[1920px] mx-auto">
            
            <div className="flex items-end gap-4 mb-8 mt-2 px-1">
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                    {loading ? (
                        <span className="flex items-center gap-2 animate-pulse text-yellow-500">Searching Live...</span>
                    ) : (
                        results.length > 0 ? 'Results' : 'Search'
                    )}
                </h1>
                {!loading && searchTerm && results.length > 0 && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-xs font-mono mb-1">
                        <Zap size={12} fill="currentColor" />
                        <span>{results.length} Found</span>
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 ${loading ? 'opacity-50 grayscale' : 'opacity-100'} transition-all duration-300`}>
                    {results.map((item, idx) => {
                        const dynamicRating = item.rating && item.rating !== "N/A" ? item.rating : getDynamicRating(item.title);
                        const dynamicYear = getYearFromTitle(item.title);
                        const seasonBadge = getSeasonBadge(item.title, item.type);

                        return (
                            <div 
                                key={idx} 
                                className="group relative bg-[#121212] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(234,179,8,0.15)] hover:-translate-y-2 animate-fade-in-up"
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="aspect-[2/3] relative overflow-hidden bg-gray-900">
                                    <img 
                                        src={item.image || item.poster} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-75"
                                        loading="lazy"
                                    />
                                    
                                    <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                                        <span className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-lg uppercase tracking-wider">
                                            {item.quality || 'HD'}
                                        </span>
                                        
                                        {item.type && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-black shadow-lg uppercase tracking-wider ${item.type === 'Series' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                {item.type}
                                            </span>
                                        )}

                                        {/* ✅ SMART BADGE UI */}
                                        {seasonBadge && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-lg uppercase tracking-wider flex items-center gap-1 border border-white/10 ${
                                                seasonBadge === 'Multi (s)' 
                                                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' 
                                                : 'bg-emerald-600 text-white' 
                                            }`}>
                                                <Layers size={9} /> {seasonBadge}
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-14 h-14 bg-yellow-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
                                            <Play fill="black" className="text-black ml-1" size={24} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 relative z-10 bg-[#121212]">
                                    <h3 className="text-gray-100 font-bold text-sm md:text-base leading-tight line-clamp-1 group-hover:text-yellow-400 transition-colors">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                        <span className="flex items-center gap-1.5">
                                            <Star size={12} className="text-yellow-500 fill-yellow-500" /> 
                                            <span className="font-semibold text-gray-200">{dynamicRating}</span>
                                        </span>
                                        <span className="flex items-center gap-1 opacity-70">
                                            <Film size={10} /> 
                                            {dynamicYear}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && !searchTerm && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-600 space-y-4">
                    <MonitorPlay size={80} className="opacity-10 text-white" />
                    <p className="text-gray-500 font-medium">Type to start searching...</p>
                </div>
            )}

            {!loading && searchTerm && results.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 space-y-6">
                    <div className="bg-white/5 p-8 rounded-full border border-white/10 shadow-2xl">
                        <Search size={64} className="opacity-20" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-white">No results found</h2>
                        <p className="text-gray-400 text-sm max-w-md mx-auto">
                            No match for <span className="text-yellow-500">"{searchTerm}"</span>.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
