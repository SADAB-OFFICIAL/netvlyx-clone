// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
  Server,
  ImageIcon,
  Settings,
  X
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
  screenshots: string[];
  downloadSections: DownloadSection[];
}

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
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  // 1. URL Decode & Data Fetching
  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

  useEffect(() => {
    if (!movieUrl) return;

    const fetchRealData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        if (!res.ok) throw new Error("Failed to load data");
        
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        setData(result);
        
        // --- SEASON DETECTION ---
        const title = result.title || "";
        const rangeMatch = title.match(/(?:season|s)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        const singleMatch = title.match(/(?:season|s)\s*(\d+)/i);
        
        const sectionSeasons = new Set<number>();
        result.downloadSections.forEach((sec: any) => {
            const m = sec.title.match(/(?:season|s)\s*0?(\d+)/i);
            if (m) sectionSeasons.add(parseInt(m[1]));
        });

        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          setAvailableSeasons(Array.from({ length: end - start + 1 }, (_, i) => start + i));
        } else if (sectionSeasons.size > 0) {
          setAvailableSeasons(Array.from(sectionSeasons).sort((a,b) => a - b));
        } else if (singleMatch) {
          setAvailableSeasons([parseInt(singleMatch[1])]);
        } else {
          setAvailableSeasons([]);
        }
        
      } catch (err) {
        console.error(err);
        setError("Content not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [movieUrl]);

  // --- 2. LOGIC: Available Qualities Extraction ---
  // Jab Season/Type change ho, tab qualities update karo
  useEffect(() => {
    if (!data) return;

    // Pehle sections ko filter karo based on Season & Type
    const filteredSections = getSectionsForQualityCheck();
    
    const qualities = new Set<string>();
    filteredSections.forEach(sec => {
        // Title mein se quality nikalo (e.g. "Download 720p")
        const qMatch = sec.title.match(/(480p|720p|1080p|2160p|4k)/i);
        if (qMatch) {
            qualities.add(qMatch[1].toLowerCase()); // '720p'
        } else {
            // Agar title mein nahi hai, to shayad links ke label mein ho?
            // Usually section title mein hoti hai, fallback ke liye "Unknown"
             qualities.add("Standard");
        }
    });

    // Sort qualities: 4k > 1080p > 720p > 480p
    const order = ['4k', '2160p', '1080p', '720p', '480p', 'standard'];
    const sortedQualities = Array.from(qualities).sort((a, b) => {
        return order.indexOf(a) - order.indexOf(b);
    });

    setAvailableQualities(sortedQualities);
    
    // Auto-select if only 1 quality exists
    if (sortedQualities.length === 1) {
       setSelectedQuality(sortedQualities[0]);
    } else {
       setSelectedQuality(null); // Reset if multiple options
    }

  }, [data, selectedSeason, downloadType, actionType]);


  // --- HELPER: Sections Filter for Quality Calculation ---
  const getSectionsForQualityCheck = () => {
    if (!data) return [];
    let sections = data.downloadSections;

    // 1. Season Filter
    if (selectedSeason !== null) {
      sections = sections.filter(sec => {
        const seasonRegex = new RegExp(`(?:season|s)[\\s\\-_]*0?${selectedSeason}(?:\\D|$)`, 'i');
        return seasonRegex.test(sec.title);
      });
    }

    // 2. Type Filter (Bulk vs Episode)
    if (actionType === 'download') {
        if (downloadType === 'bulk') {
          sections = sections.filter(sec => 
            /pack|zip|batch|complete|collection|volume/i.test(sec.title)
          );
        } else if (downloadType === 'episode') {
          sections = sections.filter(sec => 
            !/pack|zip|batch|complete|collection|volume/i.test(sec.title)
          );
        }
    }

    return sections;
  };

  // --- 3. FINAL LINK FILTERING (Applied after Quality Select) ---
  const getFinalLinks = () => {
    let sections = getSectionsForQualityCheck();

    // 3. Quality Filter
    if (selectedQuality) {
        sections = sections.filter(sec => 
            sec.title.toLowerCase().includes(selectedQuality.toLowerCase()) || 
            (selectedQuality === 'standard' && !/(480p|720p|1080p|4k)/i.test(sec.title))
        );
    }

    return sections;
  };

  const handleLinkClick = (url: string) => {
    const key = btoa(JSON.stringify({ link: url, source: 'netvlyx' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    router.push(`/vlyxdrive?key=${key}`);
  };

  const resetSelection = () => {
    setActionType(null);
    setDownloadType(null);
    setSelectedQuality(null);
    if (availableSeasons.length === 0) router.back();
  };

  // Steps handling
  const goBackStep = () => {
      if (selectedQuality) setSelectedQuality(null);
      else if (downloadType) setDownloadType(null);
      else if (actionType) setActionType(null);
      else if (selectedSeason) setSelectedSeason(null);
      else router.back();
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-fade-in font-sans">
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110" style={{ backgroundImage: `url(${data?.poster || '/placeholder.png'})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 py-2 px-4 rounded-full border border-white/10">
          <ArrowLeft size={18} /> Back
        </button>
        
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Poster */}
          <div className="w-full lg:w-[320px] flex-shrink-0 mx-auto lg:mx-0">
             <img src={data?.poster} alt={data?.title} className="rounded-2xl shadow-2xl w-full" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{data?.title}</h1>
            
            <div className="flex gap-4 mb-6 text-sm text-gray-300">
               <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">IMDb 8.5</span>
               {availableSeasons.length > 0 && <span className="bg-red-600/20 text-red-500 px-2 py-1 rounded">{availableSeasons.length} Seasons</span>}
            </div>

            <p className="text-gray-400 text-lg mb-8 line-clamp-4">{data?.plot}</p>

            {/* Screenshots */}
            {data?.screenshots && data.screenshots.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon className="text-blue-500"/> Screenshots</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.screenshots.map((src, i) => (
                    <img key={i} src={src} className="rounded-lg border border-gray-800" alt="Screen" />
                  ))}
                </div>
              </div>
            )}

            {/* --- LOGIC UI START --- */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-300">
              
              {/* HEADER WITH BACK BUTTON */}
              {(selectedSeason || actionType) && (
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                    <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                        <ArrowLeft size={14}/> Previous Step
                    </button>
                    <div className="text-sm font-bold text-gray-500">
                        {selectedSeason ? `S${selectedSeason}` : ''} 
                        {actionType ? ` > ${actionType === 'watch' ? 'Watch' : 'DL'}` : ''}
                        {downloadType ? ` > ${downloadType}` : ''}
                        {selectedQuality ? ` > ${selectedQuality}` : ''}
                    </div>
                 </div>
              )}

              {/* STEP 1: Season Select */}
              {availableSeasons.length > 0 && selectedSeason === null && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Film className="text-red-500" /> Select Season</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {availableSeasons.map((season) => (
                      <button key={season} onClick={() => setSelectedSeason(season)} className="p-4 rounded-xl bg-gray-800 hover:bg-red-600 transition-colors text-xl font-bold border border-gray-700">
                        Season {season}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Action Select */}
              {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                <div className="animate-fade-in">
                   <h3 className="text-2xl font-bold mb-6">Choose Action</h3>
                   <div className="grid grid-cols-2 gap-6">
                      <button onClick={() => setActionType('download')} className="p-6 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-xl text-center group">
                         <HardDrive className="mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" size={32} />
                         <span className="font-bold text-lg">Download</span>
                      </button>
                      <button onClick={() => setActionType('watch')} className="p-6 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-xl text-center group">
                         <Play className="mx-auto mb-2 text-green-400 fill-current group-hover:scale-110 transition-transform" size={32} />
                         <span className="font-bold text-lg">Watch Online</span>
                      </button>
                   </div>
                </div>
              )}

              {/* STEP 3: Type Select (Only for Download + Series) */}
              {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                 <div className="animate-fade-in">
                    <h3 className="text-xl font-bold mb-6 text-center">Select Download Type</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => setDownloadType('episode')} className="p-5 bg-gray-800 hover:bg-purple-600 rounded-xl font-bold flex flex-col items-center gap-2 border border-gray-700 transition-all">
                          <Film /> Episode Wise
                          <span className="text-xs font-normal opacity-70">Single Files</span>
                       </button>
                       <button onClick={() => setDownloadType('bulk')} className="p-5 bg-gray-800 hover:bg-orange-600 rounded-xl font-bold flex flex-col items-center gap-2 border border-gray-700 transition-all">
                          <Server /> Bulk / Zip
                          <span className="text-xs font-normal opacity-70">Complete Pack</span>
                       </button>
                    </div>
                 </div>
              )}

              {/* STEP 4: Quality Select (NEW STEP) */}
              {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                 <div className="animate-fade-in">
                    <h3 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                        <Settings size={20} /> Select Quality
                    </h3>
                    
                    {availableQualities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {availableQualities.map((q) => (
                                <button 
                                    key={q} 
                                    onClick={() => setSelectedQuality(q)}
                                    className="p-4 rounded-xl bg-gray-800 hover:bg-blue-600 border border-gray-700 font-bold text-lg uppercase transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-400 mb-4">No specific qualities detected.</p>
                            <button onClick={() => setSelectedQuality('Standard')} className="px-6 py-2 bg-blue-600 rounded-lg">Show All Links</button>
                        </div>
                    )}
                 </div>
              )}

              {/* STEP 5: Final Links Display */}
              {selectedQuality !== null && (
                <div className="animate-fade-in">
                   <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
                      <CheckCircle /> Available Links
                   </h3>
                   
                   <div className="space-y-4">
                      {getFinalLinks().length > 0 ? (
                        getFinalLinks().map((section, idx) => (
                          <div key={idx} className="bg-black/40 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-colors">
                             <h4 className="text-blue-400 font-bold mb-3 text-sm uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                {section.title}
                             </h4>
                             <div className="flex flex-wrap gap-3">
                                {section.links.map((link, j) => (
                                   <button 
                                     key={j} 
                                     onClick={() => handleLinkClick(link.url)}
                                     className={`px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-all ${
                                         actionType === 'watch' 
                                         ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600' 
                                         : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
                                     }`}
                                   >
                                      {actionType === 'watch' ? <Play size={16} className="fill-current"/> : <Download size={16}/>} 
                                      {link.label}
                                   </button>
                                ))}
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-8 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                           <AlertCircle className="mx-auto mb-2 text-gray-500"/>
                           <p className="text-gray-400">No links found for <span className="text-white font-bold">{selectedQuality}</span>.</p>
                           <button onClick={() => setSelectedQuality(null)} className="mt-4 text-blue-400 hover:underline">Try another quality</button>
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
