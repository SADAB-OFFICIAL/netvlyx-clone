// app/v/[...slug]/MovieClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, AlertCircle, 
  Film, CheckCircle, ImageIcon, Settings, Archive, Tv
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

export default function MovieClient() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Logic State ---
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'watch' | 'download' | null>(null);
  const [downloadType, setDownloadType] = useState<'episode' | 'bulk' | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  // 1. Fetching Logic
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
        
        // Season Detection
        const title = result.title || "";
        const rangeMatch = title.match(/(?:season|s)\s*(\d+)\s*[-–—]\s*(\d+)/i);
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

  // --- STRICT HELPER: Is Bulk Link? ---
  const isBulkLink = (sectionTitle: string, linkLabel: string) => {
    const text = (sectionTitle + " " + linkLabel).toLowerCase();
    return /batch|zip|pack|complete|volume|collection/.test(text);
  };

  // --- 2. LOGIC: Process Sections (Action & Type Filter) ---
  const getProcessedSections = () => {
    if (!data) return [];
    
    // Step A: Season Filter
    let sections = data.downloadSections.filter(sec => {
        if (selectedSeason === null) return true;
        const seasonRegex = new RegExp(`(?:season|s)[\\s\\-_]*0?${selectedSeason}(?:\\D|$)`, 'i');
        return seasonRegex.test(sec.title);
    });

    // Step B: Action & Type Filter (Strict Logic)
    sections = sections.map(sec => {
        const filteredLinks = sec.links.filter(link => {
            const isBulk = isBulkLink(sec.title, link.label);

            if (actionType === 'watch') {
                // Watch Online: Hide Bulk/Zip links
                return !isBulk;
            } 
            else if (actionType === 'download') {
                if (downloadType === 'bulk') {
                    // Download -> Bulk: Show ONLY Bulk links
                    return isBulk;
                } else if (downloadType === 'episode') {
                    // Download -> Episode: Show ONLY Non-Bulk links
                    return !isBulk;
                }
            }
            return true;
        });
        return { ...sec, links: filteredLinks };
    }).filter(sec => sec.links.length > 0);

    return sections;
  };

  // --- 3. LOGIC: Quality Extraction ---
  useEffect(() => {
    if (!data) return;
    const currentSections = getProcessedSections(); 
    
    const qualities = new Set<string>();
    currentSections.forEach(sec => {
        const qMatch = sec.title.match(/(480p|720p|1080p|2160p|4k)/i);
        if (qMatch) qualities.add(qMatch[1].toLowerCase());
        else {
            sec.links.forEach(l => {
                const lMatch = l.label.match(/(480p|720p|1080p|2160p|4k)/i);
                if (lMatch) qualities.add(lMatch[1].toLowerCase());
            });
        }
    });

    if (qualities.size === 0) qualities.add("Standard");

    const order = ['4k', '2160p', '1080p', '720p', '480p', 'standard'];
    const sorted = Array.from(qualities).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    setAvailableQualities(sorted);

    if (actionType && ((downloadType) || actionType === 'watch')) {
        setSelectedQuality(null);
    }

  }, [data, selectedSeason, downloadType, actionType]);

  // --- 4. LOGIC: Final Data ---
  const getFinalData = () => {
    let sections = getProcessedSections();

    if (selectedQuality && selectedQuality !== "Standard") {
        sections = sections.map(sec => {
             const secHasQuality = sec.title.toLowerCase().includes(selectedQuality.toLowerCase());
             
             const matchingLinks = sec.links.filter(l => 
                 l.label.toLowerCase().includes(selectedQuality.toLowerCase()) || 
                 (secHasQuality && !/(480p|720p|1080p|4k)/i.test(l.label))
             );

             if (secHasQuality && matchingLinks.length === 0) return sec; 
             
             return { ...sec, links: matchingLinks };
        }).filter(sec => sec.links.length > 0);
    }
    return sections;
  };

  const handleLinkClick = (url: string) => {
    const payload = {
        link: url,
        source: 'netvlyx',
        title: data?.title || 'Unknown Title',
        poster: data?.poster || '',
        quality: selectedQuality || null
    };
    const key = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/vlyxdrive?key=${key}`);
  };

  const goBackStep = () => {
      if (selectedQuality) setSelectedQuality(null);
      else if (downloadType) setDownloadType(null);
      else if (actionType) setActionType(null);
      else if (selectedSeason) setSelectedSeason(null);
      else router.back();
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">{error}</div>;

  const finalSections = getFinalData();

  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-fade-in font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110" style={{ backgroundImage: `url(${data?.poster || '/placeholder.png'})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 py-2 px-4 rounded-full border border-white/10">
          <ArrowLeft size={18} /> Back
        </button>
        
        <div className="flex flex-col lg:flex-row gap-10">
          {/* POSTER */}
          <div className="w-full lg:w-[320px] flex-shrink-0 mx-auto lg:mx-0">
             <img src={data?.poster} alt={data?.title} className="rounded-2xl shadow-2xl w-full border border-white/10" />
          </div>

          <div className="flex-1 min-w-0">
            {/* TITLE & INFO */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{data?.title}</h1>
            <div className="flex gap-4 mb-6 text-sm text-gray-300">
               <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20 font-bold">IMDb 8.5</span>
               {availableSeasons.length > 0 && <span className="bg-red-600/20 text-red-500 px-2 py-1 rounded border border-red-500/20 font-bold">{availableSeasons.length} Seasons</span>}
            </div>

            {/* DESCRIPTION */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-8 backdrop-blur-sm">
                <h3 className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider">Plot Summary</h3>
                <p className="text-gray-300 text-lg leading-relaxed">{data?.plot}</p>
            </div>

            {/* SCREENSHOTS */}
            {data?.screenshots && data.screenshots.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon className="text-blue-500"/> Screenshots</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.screenshots.map((src, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-lg border border-gray-800 aspect-video bg-black/50">
                        <img src={src} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" alt={`Scene ${i+1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- MAIN LOGIC CONTAINER --- */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-300">
              
              {/* HEADER WITH BACK BUTTON */}
              {(selectedSeason || actionType) && (
                 <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                    <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                        <ArrowLeft size={14}/> Previous
                    </button>
                    <div className="text-sm font-bold text-gray-500 hidden sm:block">
                        {selectedSeason ? `S${selectedSeason}` : ''} 
                        {actionType ? ` > ${actionType === 'watch' ? 'Stream' : 'DL'}` : ''}
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
                      <button key={season} onClick={() => setSelectedSeason(season)} className="p-4 rounded-xl bg-gray-800 hover:bg-red-600 transition-all hover:scale-105 text-xl font-bold border border-gray-700 shadow-lg">
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
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button onClick={() => setActionType('download')} className="p-8 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-2xl text-center group transition-all hover:-translate-y-1">
                         <HardDrive className="mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform" size={48} />
                         <span className="font-bold text-2xl block text-white">Download</span>
                         <span className="text-sm text-blue-300 mt-2 block">Save to Device</span>
                      </button>
                      <button onClick={() => setActionType('watch')} className="p-8 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-2xl text-center group transition-all hover:-translate-y-1">
                         <Play className="mx-auto mb-4 text-green-400 fill-current group-hover:scale-110 transition-transform" size={48} />
                         <span className="font-bold text-2xl block text-white">Watch Online</span>
                         <span className="text-sm text-green-300 mt-2 block">Stream Instantly</span>
                      </button>
                   </div>
                </div>
              )}

              {/* STEP 3: Download Type Select */}
              {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                 <div className="animate-fade-in">
                    <h3 className="text-2xl font-bold mb-6 text-center">Select Download Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <button onClick={() => setDownloadType('episode')} className="p-8 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-2xl text-center group transition-all hover:-translate-y-1">
                          <Tv className="mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" size={48} />
                          <span className="font-bold text-2xl block text-white">Episode Wise</span>
                          <span className="text-sm text-purple-300 mt-2 block">Single File Links</span>
                       </button>
                       <button onClick={() => setDownloadType('bulk')} className="p-8 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 rounded-2xl text-center group transition-all hover:-translate-y-1">
                          <Archive className="mx-auto mb-4 text-orange-400 group-hover:scale-110 transition-transform" size={48} />
                          <span className="font-bold text-2xl block text-white">Bulk / Zip</span>
                          <span className="text-sm text-orange-300 mt-2 block">Complete Pack</span>
                       </button>
                    </div>
                 </div>
              )}

              {/* STEP 4: Quality Select */}
              {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                 <div className="animate-fade-in">
                    <h3 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2"><Settings size={20} /> Select Quality</h3>
                    {availableQualities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {availableQualities.map((q) => (
                                <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 rounded-xl bg-gray-800 hover:bg-blue-600 border border-gray-700 font-bold text-lg uppercase transition-all shadow-lg hover:-translate-y-0.5">{q}</button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center"><button onClick={() => setSelectedQuality('Standard')} className="px-6 py-2 bg-blue-600 rounded-lg font-bold">Show All Links</button></div>
                    )}
                 </div>
              )}

              {/* STEP 5: Final Links */}
              {selectedQuality !== null && (
                <div className="animate-fade-in">
                   <h3 className="text-xl font-bold mb-6 text-green-400 flex items-center gap-2"><CheckCircle /> Available Links</h3>
                   <div className="space-y-4">
                      {finalSections.length > 0 ? (
                        finalSections.map((section, idx) => (
                            <div key={idx} className="bg-black/40 rounded-xl p-5 border border-gray-700 hover:border-blue-500/30 transition-colors">
                                <h4 className="text-blue-400 font-bold mb-4 text-sm uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>{section.title}
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {section.links.map((link, j) => (
                                        <button 
                                            key={j} 
                                            onClick={() => handleLinkClick(link.url)} 
                                            className={`
                                                px-5 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-1 border border-white/5
                                                ${actionType === 'watch' 
                                                    ? 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white' 
                                                    : 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white'}
                                            `}
                                        >
                                            {actionType === 'watch' ? <Play size={16} className="fill-current"/> : <Download size={16}/>} 
                                            {link.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                      ) : (
                        <div className="text-center p-12 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700">
                           <AlertCircle className="mx-auto mb-4 text-gray-500" size={40}/>
                           <p className="text-gray-400 text-lg">No links found for <span className="text-white font-bold">{selectedQuality}</span>.</p>
                           <button onClick={() => setSelectedQuality(null)} className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-bold text-blue-400 transition-colors">Choose different quality</button>
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
