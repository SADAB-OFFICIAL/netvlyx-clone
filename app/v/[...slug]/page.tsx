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
  ImageIcon
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

  // --- Logic State ---
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'watch' | 'download' | null>(null);
  const [downloadType, setDownloadType] = useState<'episode' | 'bulk' | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);

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
        
        // --- SEASON DETECTION LOGIC ---
        // Title example: "Stranger Things Season 1-4 Download"
        const title = result.title || "";
        const rangeMatch = title.match(/(?:season|s)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        const singleMatch = title.match(/(?:season|s)\s*(\d+)/i);
        
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          // Agar range ulti hai ya barabar hai to fix karo
          if (start < end) {
             setAvailableSeasons(Array.from({ length: end - start + 1 }, (_, i) => start + i));
          } else {
             setAvailableSeasons([start]);
          }
        } else if (singleMatch) {
          // Agar title mein 'Season 2' likha hai, matlab shayad ye single season page hai
          // Lekin agar links mein multiple seasons huye to?
          // Fallback: Check download sections for seasons
          const sectionSeasons = new Set<number>();
          result.downloadSections.forEach((sec: any) => {
            const m = sec.title.match(/(?:season|s)\s*0?(\d+)/i);
            if (m) sectionSeasons.add(parseInt(m[1]));
          });

          if (sectionSeasons.size > 0) {
            setAvailableSeasons(Array.from(sectionSeasons).sort((a,b) => a - b));
          } else {
            setAvailableSeasons([parseInt(singleMatch[1])]);
          }
        } else {
          // No season in title -> Check sections
           const sectionSeasons = new Set<number>();
           result.downloadSections.forEach((sec: any) => {
            const m = sec.title.match(/(?:season|s)\s*0?(\d+)/i);
            if (m) sectionSeasons.add(parseInt(m[1]));
          });
          if (sectionSeasons.size > 0) {
             setAvailableSeasons(Array.from(sectionSeasons).sort((a,b) => a - b));
          } else {
             setAvailableSeasons([]); // Movie logic
          }
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

  // --- FILTERING LOGIC (Main Work) ---
  const getFilteredLinks = () => {
    if (!data || !data.downloadSections) return [];

    let filteredSections = data.downloadSections;

    // 1. Season Filter
    if (selectedSeason !== null) {
      filteredSections = filteredSections.filter(sec => {
        // Section Title mein season dhundo (e.g. "Download S01 720p")
        const seasonRegex = new RegExp(`(?:season|s)[\\s\\-_]*0?${selectedSeason}(?:\\D|$)`, 'i');
        
        // Agar Section title mein season hai to match karo
        if (seasonRegex.test(sec.title)) return true;
        
        // Agar section title generic hai (e.g. "720p Links"), to links ke andar check karo?
        // Usually Movies4u sections ko season wise alag karta hai, so title check is best.
        return false; 
      });
    }

    // 2. Type Filter (Bulk vs Episode)
    if (downloadType === 'bulk') {
      filteredSections = filteredSections.filter(sec => 
        /pack|zip|batch|complete|collection/i.test(sec.title)
      );
    } else if (downloadType === 'episode') {
      filteredSections = filteredSections.filter(sec => 
        !/pack|zip|batch|complete|collection/i.test(sec.title)
      );
    }

    return filteredSections;
  };

  const handleLinkClick = (url: string) => {
    const key = btoa(JSON.stringify({ link: url, source: 'netvlyx' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    router.push(`/vlyxdrive?key=${key}`);
  };

  // Reset Logic
  const resetSelection = () => {
    setActionType(null);
    setDownloadType(null);
    if (availableSeasons.length === 0) router.back();
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
            <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
              
              {/* 1. Season Select */}
              {availableSeasons.length > 0 && selectedSeason === null && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Film className="text-red-500" /> Select Season</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {availableSeasons.map((season) => (
                      <button key={season} onClick={() => setSelectedSeason(season)} className="p-4 rounded-xl bg-gray-800 hover:bg-red-600 transition-colors text-xl font-bold">
                        Season {season}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Action Select */}
              {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                <div>
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold">{selectedSeason ? `Season ${selectedSeason}` : 'Movie'} Options</h3>
                      {selectedSeason && <button onClick={() => setSelectedSeason(null)} className="text-sm text-gray-400">Change Season</button>}
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <button onClick={() => setActionType('download')} className="p-6 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-xl text-center">
                         <HardDrive className="mx-auto mb-2 text-blue-400" size={32} />
                         <span className="font-bold text-lg">Download</span>
                      </button>
                      <button onClick={() => setActionType('watch')} className="p-6 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-xl text-center">
                         <Play className="mx-auto mb-2 text-green-400 fill-current" size={32} />
                         <span className="font-bold text-lg">Watch Online</span>
                      </button>
                   </div>
                </div>
              )}

              {/* 3. Type Select (Only for Download + Series) */}
              {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                 <div>
                    <button onClick={() => setActionType(null)} className="text-gray-400 mb-4 flex gap-1 items-center"><ArrowLeft size={14}/> Back</button>
                    <h3 className="text-xl font-bold mb-4 text-center">Download Type</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => setDownloadType('episode')} className="p-4 bg-gray-800 hover:bg-purple-600 rounded-xl font-bold flex flex-col items-center gap-2">
                          <Film /> Episode Wise
                       </button>
                       <button onClick={() => setDownloadType('bulk')} className="p-4 bg-gray-800 hover:bg-orange-600 rounded-xl font-bold flex flex-col items-center gap-2">
                          <Server /> Bulk / Zip
                       </button>
                    </div>
                 </div>
              )}

              {/* 4. Links Display */}
              {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && (
                <div>
                   <button onClick={resetSelection} className="text-gray-400 mb-6 flex gap-1 items-center"><ArrowLeft size={14}/> Back to Options</button>
                   <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
                      <CheckCircle /> Links Found
                   </h3>
                   
                   <div className="space-y-4">
                      {getFilteredLinks().length > 0 ? (
                        getFilteredLinks().map((section, idx) => (
                          <div key={idx} className="bg-black/40 rounded-xl p-4 border border-gray-700">
                             <h4 className="text-blue-400 font-bold mb-3 text-sm uppercase">{section.title}</h4>
                             <div className="flex flex-wrap gap-3">
                                {section.links.map((link, j) => (
                                   <button 
                                     key={j} 
                                     onClick={() => handleLinkClick(link.url)}
                                     className={`px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${actionType === 'watch' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                   >
                                      {actionType === 'watch' ? <Play size={14} className="fill-current"/> : <Download size={14}/>} 
                                      {link.label}
                                   </button>
                                ))}
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-8 bg-gray-800/50 rounded-xl">
                           <p className="text-gray-400">No links found for this selection.</p>
                           {availableSeasons.length > 0 && <p className="text-xs text-gray-500 mt-2">Try changing download type (Bulk/Episode)</p>}
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
