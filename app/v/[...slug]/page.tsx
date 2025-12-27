// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, AlertCircle, 
  Film, CheckCircle, Server, ImageIcon, Settings, CloudLightning
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

interface EpisodeGroup {
  episode: number;
  links: DownloadLink[];
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
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  // 1. Data Fetching
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

  // --- Helper: Is Bulk? ---
  const isBulkLink = (sectionTitle: string, linkLabel: string) => {
    const text = (sectionTitle + " " + linkLabel).toLowerCase();
    return /batch|zip|pack|complete|volume|collection/.test(text);
  };

  // --- Helper: Group Links ---
  const groupLinksByEpisode = (sections: DownloadSection[]) => {
    const groups: Record<number, EpisodeGroup> = {};
    const others: DownloadLink[] = [];

    sections.forEach(sec => {
      sec.links.forEach(link => {
        const match = link.label.match(/(?:episode|ep|e)\s*0?(\d+)/i) || link.label.match(/\b\d+x0?(\d+)\b/);
        if (match) {
          const epNum = parseInt(match[1]);
          if (!groups[epNum]) groups[epNum] = { episode: epNum, links: [] };
          groups[epNum].links.push(link);
        } else {
          others.push(link);
        }
      });
    });

    const sortedGroups = Object.values(groups).sort((a, b) => a.episode - b.episode);
    return { groups: sortedGroups, others };
  };

  // --- 2. LOGIC: Process Sections (Season & Type Filter) ---
  const getProcessedSections = () => {
    if (!data) return [];
    
    let sections = data.downloadSections.filter(sec => {
        if (selectedSeason === null) return true;
        const seasonRegex = new RegExp(`(?:season|s)[\\s\\-_]*0?${selectedSeason}(?:\\D|$)`, 'i');
        return seasonRegex.test(sec.title);
    });

    if (actionType === 'download' && downloadType) {
        sections = sections.map(sec => {
            const filteredLinks = sec.links.filter(link => {
                const isBulk = isBulkLink(sec.title, link.label);
                return downloadType === 'bulk' ? isBulk : !isBulk;
            });
            return { ...sec, links: filteredLinks };
        }).filter(sec => sec.links.length > 0);
    }
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

    // Reset quality when filters change
    setSelectedQuality(null);

  }, [data, selectedSeason, downloadType, actionType]);

  // --- 4. LOGIC: Final Data with Quality Filter (FIXED) ---
  const getFinalData = () => {
    let sections = getProcessedSections();

    if (selectedQuality && selectedQuality !== "Standard") {
        sections = sections.filter(sec => {
            // Check if Section Title has quality
            const secMatch = sec.title.toLowerCase().includes(selectedQuality.toLowerCase());
            
            if (secMatch) return true; // Keep whole section if title matches
            
            // Otherwise, filter links inside
            return sec.links.some(l => l.label.toLowerCase().includes(selectedQuality.toLowerCase()));
        }).map(sec => {
             // If Section title didn't match, remove non-matching links
             if (!sec.title.toLowerCase().includes(selectedQuality.toLowerCase())) {
                 return {
                     ...sec,
                     links: sec.links.filter(l => l.label.toLowerCase().includes(selectedQuality.toLowerCase()))
                 };
             }
             return sec;
        }).filter(sec => sec.links.length > 0);
    }

    if (downloadType === 'episode') {
        return { type: 'grouped', data: groupLinksByEpisode(sections) };
    }
    return { type: 'sections', data: sections };
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

  const finalContent = getFinalData();

  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-fade-in font-sans">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110" style={{ backgroundImage: `url(${data?.poster || '/placeholder.png'})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 py-2 px-4 rounded-full border border-white/10">
          <ArrowLeft size={18} /> Back
        </button>
        
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-[320px] flex-shrink-0 mx-auto lg:mx-0">
             <img src={data?.poster} alt={data?.title} className="rounded-2xl shadow-2xl w-full" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{data?.title}</h1>
            <div className="flex gap-4 mb-6 text-sm text-gray-300">
               <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">IMDb 8.5</span>
               {availableSeasons.length > 0 && <span className="bg-red-600/20 text-red-500 px-2 py-1 rounded">{availableSeasons.length} Seasons</span>}
            </div>
            <p className="text-gray-400 text-lg mb-8 line-clamp-4">{data?.plot}</p>

            <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-300">
              {(selectedSeason || actionType) && (
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
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

              {/* Steps UI (Same as before) */}
              {availableSeasons.length > 0 && selectedSeason === null && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Film className="text-red-500" /> Select Season</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {availableSeasons.map((season) => (
                      <button key={season} onClick={() => setSelectedSeason(season)} className="p-4 rounded-xl bg-gray-800 hover:bg-red-600 transition-colors text-xl font-bold border border-gray-700">Season {season}</button>
                    ))}
                  </div>
                </div>
              )}

              {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                <div className="animate-fade-in">
                   <h3 className="text-2xl font-bold mb-6">Choose Action</h3>
                   <div className="grid grid-cols-2 gap-6">
                      <button onClick={() => setActionType('download')} className="p-6 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-xl text-center group"><HardDrive className="mx-auto mb-2 text-blue-400" size={32}/><span className="font-bold text-lg">Download</span></button>
                      <button onClick={() => setActionType('watch')} className="p-6 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-xl text-center group"><Play className="mx-auto mb-2 text-green-400 fill-current" size={32}/><span className="font-bold text-lg">Watch Online</span></button>
                   </div>
                </div>
              )}

              {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                 <div className="animate-fade-in">
                    <h3 className="text-xl font-bold mb-6 text-center">Select Download Type</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => setDownloadType('episode')} className="p-5 bg-gray-800 hover:bg-purple-600 rounded-xl font-bold flex flex-col items-center gap-2 border border-gray-700"><Film /> Episode Wise</button>
                       <button onClick={() => setDownloadType('bulk')} className="p-5 bg-gray-800 hover:bg-orange-600 rounded-xl font-bold flex flex-col items-center gap-2 border border-gray-700"><Server /> Bulk / Zip</button>
                    </div>
                 </div>
              )}

              {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                 <div className="animate-fade-in">
                    <h3 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2"><Settings size={20} /> Select Quality</h3>
                    {availableQualities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {availableQualities.map((q) => (
                                <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 rounded-xl bg-gray-800 hover:bg-blue-600 border border-gray-700 font-bold text-lg uppercase transition-all">{q}</button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center"><button onClick={() => setSelectedQuality('Standard')} className="px-6 py-2 bg-blue-600 rounded-lg">Show All Links</button></div>
                    )}
                 </div>
              )}

              {selectedQuality !== null && (
                <div className="animate-fade-in">
                   <h3 className="text-xl font-bold mb-6 text-green-400 flex items-center gap-2"><CheckCircle /> Available Links</h3>
                   <div className="space-y-4">
                      {finalContent.type === 'grouped' && (
                        (finalContent.data as any).groups.length > 0 ? (
                            (finalContent.data as any).groups.map((group: EpisodeGroup) => (
                                <div key={group.episode} className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700">
                                    <div className="bg-gray-800/80 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                                        <span className="font-bold text-white flex items-center gap-2"><Play size={16} className="text-blue-500 fill-current"/> Episode {group.episode}</span>
                                    </div>
                                    <div className="p-4 flex flex-wrap gap-3">
                                        {group.links.map((link, idx) => (
                                            <button key={idx} onClick={() => handleLinkClick(link.url)} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600/50 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-sm font-semibold shadow-lg transition-all">
                                                <Server size={16}/> {link.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (<div className="text-center p-8 text-gray-400">No links found for {selectedQuality}.</div>)
                      )}
                      
                      {finalContent.type === 'sections' && (
                         (finalContent.data as DownloadSection[]).length > 0 ? (
                            (finalContent.data as DownloadSection[]).map((section, idx) => (
                                <div key={idx} className="bg-black/40 rounded-xl p-4 border border-gray-700">
                                    <h4 className="text-blue-400 font-bold mb-3 text-sm uppercase flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>{section.title}</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {section.links.map((link, j) => (
                                            <button key={j} onClick={() => handleLinkClick(link.url)} className={`px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg ${actionType === 'watch' ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
                                                {actionType === 'watch' ? <Play size={16} className="fill-current"/> : <Download size={16}/>} {link.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                         ) : (<div className="text-center p-8 bg-gray-800/50 rounded-xl border border-dashed border-gray-700"><p className="text-gray-400">No links found for {selectedQuality}.</p></div>)
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
