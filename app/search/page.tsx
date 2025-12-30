'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Play, Info, Search, MonitorPlay, 
  ChevronLeft, Star, Loader2, X 
} from 'lucide-react';
import TwinklingStars from '@/components/TwinklingStars';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || ''; // URL se 'q' (e.g. Jawan) nikalo

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);

  // --- SEARCH API CALL ---
  // Yeh aapke banaye hue API route ko call karega
  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
          setLoading(false);
          return;
      }
      
      setLoading(true);
      try {
        // Aapka API Route yahan call ho raha hai 👇
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.success && Array.isArray(data.results)) {
            setResults(data.results);
        } else {
            setResults([]);
        }
      } catch (error) {
        console.error("Search Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  // --- HANDLERS ---
  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleItemClick = (item: any) => {
      if (item.link) {
          const encodedLink = btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
          router.push(`/v/${encodedLink}`);
      }
  };

  return (
    <div className="min-h-screen relative bg-black text-white font-sans">
      <TwinklingStars />
      
      <div className="relative z-10 bg-gradient-to-b from-transparent via-black/50 to-[#0a0a0a]">
        
        {/* HEADER / NAVBAR */}
        <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 md:px-12 py-4 flex items-center justify-between gap-4">
            
            {/* Back Button & Logo */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/')} className="p-2 bg-gray-800 rounded-full hover:bg-white hover:text-black transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="hidden md:flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                    <MonitorPlay className="text-yellow-500" size={24} />
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                        NETVLYX
                    </span>
                </div>
            </div>

            {/* Search Input Area */}
            <form onSubmit={handleNewSearch} className="flex-1 max-w-xl relative">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for movies..." 
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-full px-5 py-2.5 pl-10 focus:outline-none focus:border-yellow-500 transition-all shadow-lg"
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                {searchTerm && (
                    <X 
                        size={16} 
                        className="absolute right-4 top-3.5 text-gray-400 cursor-pointer hover:text-white"
                        onClick={() => { setSearchTerm(''); router.push('/search'); }}
                    />
                )}
            </form>
        </div>

        {/* CONTENT AREA */}
        <div className="p-4 md:p-12 pb-20 min-h-[80vh]">
            
            {/* Heading */}
            <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
                {loading ? 'Searching...' : `Results for "${query}"`}
                {!loading && <span className="text-sm font-normal text-gray-500 bg-gray-900 px-2 py-1 rounded-md">{results.length} Found</span>}
            </h1>

            {/* Grid */}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                    {results.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="relative group aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:scale-105 hover:shadow-yellow-500/20 hover:z-10 transition-all duration-300"
                            onClick={() => handleItemClick(item)}
                        >
                            <img 
                                src={item.image || item.poster} 
                                alt={item.title} 
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                <h3 className="text-white font-bold text-xs md:text-sm leading-tight mb-1 line-clamp-2">{item.title}</h3>
                                <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-300">
                                    {item.quality && (
                                        <span className="bg-gray-700 px-1.5 rounded text-white">{item.quality}</span>
                                    )}
                                    <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500" /> 8.5</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                     <button className="bg-white text-black p-2 rounded-full hover:bg-yellow-400 transition-colors">
                                        <Play size={12} fill="currentColor" />
                                     </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center h-64 text-yellow-500">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p className="text-gray-400 text-sm animate-pulse">Searching Universe...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && results.length === 0 && query && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Search size={64} className="mb-4 opacity-20" />
                    <h2 className="text-xl font-bold">No results found</h2>
                    <p className="text-sm mt-2">Try searching for a different keyword.</p>
                </div>
            )}
            
            {/* Initial State */}
            {!loading && !query && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                    <Search size={64} className="mb-4 opacity-20" />
                    <p>Type something to start searching...</p>
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
