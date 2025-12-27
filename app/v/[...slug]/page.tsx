// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Play, 
  HardDrive, 
  Download, 
  AlertCircle, 
  Calendar, 
  Star, 
  Film, 
  CheckCircle,
  ChevronRight,
  Server
} from 'lucide-react';

// --- Types ---
interface DownloadLink {
  label: string;
  url: string;
}

interface DownloadSection {
  title: string;
  links: DownloadLink[];
}

interface MovieData {
  title: string;
  poster: string;
  plot: string;
  downloadSections: DownloadSection[];
}

// --- Main Component ---
export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Logic State Variables ---
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'watch' | 'download' | null>(null);
  const [downloadType, setDownloadType] = useState<'episode' | 'bulk' | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);

  // 1. URL Decode Logic
  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

  // 2. Real Data Fetching
  useEffect(() => {
    if (!movieUrl) return;

    const fetchRealData = async () => {
      try {
        setLoading(true);
        // Backend API call
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        
        if (!res.ok) throw new Error("Failed to load movie data");
        
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        setData(result);
        
        // Detect Seasons from Title (e.g., "Stranger Things Season 1-4")
        extractSeasons(result.title);
        
      } catch (err) {
        console.error(err);
        setError("Content not found or link expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [movieUrl]);

  // --- Helper: Extract Seasons from Title ---
  const extractSeasons = (title: string) => {
    // Patterns: "Season 1-5", "S01-S03", "Season 4"
    const rangeMatch = title.match(/season\s*(\d+)\s*[-–—]\s*(\d+)/i);
    const singleMatch = title.match(/season\s*(\d+)/i);
    
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      const seasons = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setAvailableSeasons(seasons);
    } else if (singleMatch) {
      // Agar sirf ek season mention hai, to sirf wahi dikhayenge
      setAvailableSeasons([parseInt(singleMatch[1])]);
    } else {
      // Agar 'Season' keyword nahi hai, to ise Movie maana jayega (No seasons)
      setAvailableSeasons([]);
    }
  };

  // --- Helper: Filter Links based on Selection ---
  const getFilteredSections = () => {
    if (!data || !data.downloadSections) return [];

    let sections = data.downloadSections;

    // 1. Filter by Season (if selected)
    if (selectedSeason !== null) {
      // Regex to match "S01", "Season 1", "S1" in section title
      const seasonRegex = new RegExp(`(?:season|s)\\s*0?${selectedSeason}(?:\\D|$)`, 'i');
      sections = sections.filter(sec => seasonRegex.test(sec.title));
    }

    // 2. Filter by Download Type (Bulk vs Episode)
    if (downloadType === 'bulk') {
      sections = sections.filter(sec => 
        /pack|zip|batch|complete|collection/i.test(sec.title)
      );
    } else if (downloadType === 'episode') {
      sections = sections.filter(sec => 
        !/pack|zip|batch|complete|collection/i.test(sec.title)
      );
    }

    return sections;
  };

  // --- VlyxDrive Redirect ---
  const handleLinkClick = (url: string) => {
    const key = btoa(JSON.stringify({ link: url, source: 'netvlyx' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    router.push(`/vlyxdrive?key=${key}`);
  };

  // --- Reset Handlers ---
  const resetSelection = () => {
    setActionType(null);
    setDownloadType(null);
    // Agar seasons hain to season selection par wapas jao, nahi to home
    if (availableSeasons.length === 0) router.back();
  };

  // --- Render Functions ---
  
  // Loading Screen
  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="w-6 h-6 text-red-600 animate-pulse" />
        </div>
      </div>
      <p className="text-gray-400 text-sm font-medium animate-pulse">Loading content...</p>
    </div>
  );

  // Error Screen
  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-red-900/50 rounded-2xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Page</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-fade-in font-sans">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110 transition-all duration-1000"
          style={{ backgroundImage: `url(${data?.poster || '/placeholder.png'})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navbar / Back */}
        <button 
          onClick={() => router.back()} 
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md py-2 px-4 rounded-full transition-all border border-white/5"
        >
          <ArrowLeft size={18} /> Back
        </button>
        
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* LEFT: Poster Area */}
          <div className="w-full lg:w-[320px] flex-shrink-0 mx-auto lg:mx-0">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-red-900/10 ring-1 ring-white/10 group">
              <img 
                src={data?.poster || '/placeholder.png'} 
                alt={data?.title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Poster')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
            </div>
          </div>

          {/* RIGHT: Content Area */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {data?.title}
            </h1>
            
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-300">
              <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                <Star size={14} className="fill-current" /> 8.5 IMDb
              </div>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                <Calendar size={14} /> 2024
              </div>
              {availableSeasons.length > 0 && (
                <div className="flex items-center gap-1 bg-red-600/20 text-red-500 px-2 py-1 rounded border border-red-600/30">
                  <Film size={14} /> {availableSeasons.length} Seasons
                </div>
              )}
            </div>

            {/* Plot */}
            <p className="text-gray-400 leading-relaxed text-lg mb-8 line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
              {data?.plot || "No synopsis available."}
            </p>

            {/* --- INTERACTIVE SECTION (Logic Starts Here) --- */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
              
              {/* Step 1: Season Selection (Only if seasons exist) */}
              {availableSeasons.length > 0 && selectedSeason === null && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Film className="text-red-500" /> Select Season
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {availableSeasons.map((season) => (
                      <button
                        key={season}
                        onClick={() => setSelectedSeason(season)}
                        className="group relative p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-red-500/50 transition-all hover:scale-105"
                      >
                        <div className="text-center">
                          <span className="text-3xl font-bold text-white group-hover:text-red-500 transition-colors">
                            {season}
                          </span>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Season</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Action Selection (Watch vs Download) */}
              {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {selectedSeason ? `Season ${selectedSeason}` : 'Movie'} Options
                    </h3>
                    {selectedSeason && (
                      <button onClick={() => setSelectedSeason(null)} className="text-sm text-gray-400 hover:text-white">
                        Change Season
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => setActionType('download')}
                      className="group p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
                    >
                      <HardDrive className="w-12 h-12 text-blue-400 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                      <h4 className="text-xl font-bold text-white text-center">Download</h4>
                      <p className="text-center text-gray-400 text-sm mt-2">Save to device storage</p>
                    </button>
                    
                    <button 
                      onClick={() => setActionType('watch')}
                      className="group p-6 rounded-2xl bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 hover:bg-green-600/30 transition-all"
                    >
                      <Play className="w-12 h-12 text-green-400 mb-4 mx-auto group-hover:scale-110 transition-transform fill-current" />
                      <h4 className="text-xl font-bold text-white text-center">Watch Online</h4>
                      <p className="text-center text-gray-400 text-sm mt-2">Stream instantly</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Type Selection (Episode vs Bulk) - Only for Series & Download */}
              {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                <div className="animate-fade-in">
                  <button onClick={() => setActionType(null)} className="text-sm text-gray-400 mb-4 hover:text-white flex items-center gap-1">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h3 className="text-xl font-bold mb-6 text-center">Choose Download Type</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setDownloadType('episode')}
                      className="p-5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 flex items-center justify-center gap-3 transition-all"
                    >
                      <Film className="text-purple-400" />
                      <span className="font-bold">Episode Wise</span>
                    </button>
                    <button 
                      onClick={() => setDownloadType('bulk')}
                      className="p-5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 flex items-center justify-center gap-3 transition-all"
                    >
                      <Server className="text-orange-400" />
                      <span className="font-bold">Bulk / Zip Pack</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Final Links Display */}
              {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && (
                <div className="animate-fade-in">
                  <button onClick={resetSelection} className="text-sm text-gray-400 mb-6 hover:text-white flex items-center gap-1">
                    <ArrowLeft size={14} /> Back to Options
                  </button>

                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                     <CheckCircle className="text-green-500" /> 
                     {availableSeasons.length > 0 
                        ? `Season ${selectedSeason} Links` 
                        : 'Download Links'}
                  </h3>

                  <div className="space-y-4">
                    {getFilteredSections().length > 0 ? (
                      getFilteredSections().map((section, idx) => (
                        <div key={idx} className="bg-black/40 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                          <h4 className="text-blue-400 font-bold mb-4 text-sm uppercase tracking-widest border-l-2 border-blue-500 pl-3">
                            {section.title}
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {section.links.map((link, j) => (
                              <button
                                key={j}
                                onClick={() => handleLinkClick(link.url)}
                                className={`
                                  flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-lg hover:-translate-y-1
                                  ${actionType === 'watch' 
                                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-green-900/50' 
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-blue-900/50'}
                                `}
                              >
                                {actionType === 'watch' ? <Play size={16} className="fill-current" /> : <Download size={16} />}
                                {link.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-black/20 rounded-xl border border-dashed border-gray-700">
                        <p className="text-gray-400">No specific links found for this selection.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
