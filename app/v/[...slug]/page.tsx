// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, Film, CheckCircle, 
  ImageIcon, Archive, Tv, ImageOff, Loader2
} from 'lucide-react';

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Logic State ---
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'watch' | 'download' | null>(null);
  const [downloadType, setDownloadType] = useState<'episode' | 'bulk' | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

  useEffect(() => {
    if (!movieUrl) return;

    const fetchRealData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        if (!res.ok) throw new Error("Failed");
        const result = await res.json();
        setData(result);
        
        // Use Backend Detected Seasons
        if (result.seasons && result.seasons.length > 0) {
            setAvailableSeasons(result.seasons);
        }
      } catch (err) {
        setError("Content not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, [movieUrl]);

  // --- SMART FILTER LOGIC ---
  const isBulkLink = (title: string, label: string) => {
    const text = (title + " " + label).toLowerCase();
    return /zip|pack|complete|batch|volume|collection/.test(text);
  };

  const getProcessedSections = () => {
    if (!data) return [];
    
    // 1. Filter by Season (Matches backend 'season' field OR generic sections)
    let sections = data.downloadSections.filter((sec: any) => {
        if (selectedSeason === null) return true;
        // Keep section if it matches season OR has no season assigned
        return sec.season === selectedSeason || sec.season === null;
    });

    // 2. Filter by Download Type (Episode vs Bulk)
    sections = sections.map((sec: any) => {
        const filteredLinks = sec.links.filter((link: any) => {
            const isBulk = isBulkLink(sec.title, link.label);

            if (actionType === 'watch') return !isBulk; // Watch: No Zips
            if (actionType === 'download') {
                if (downloadType === 'bulk') return isBulk;
                if (downloadType === 'episode') return !isBulk;
            }
            return true;
        });
        return { ...sec, links: filteredLinks };
    }).filter((sec: any) => sec.links.length > 0);

    return sections;
  };

  // --- Extract Qualities from Filtered Data ---
  useEffect(() => {
    if (!data) return;
    const currentSections = getProcessedSections(); 
    
    const qualities = new Set<string>();
    currentSections.forEach((sec: any) => {
        if (sec.quality) qualities.add(sec.quality);
        else {
            // Fallback Regex if backend missed it
            const t = sec.title.toLowerCase();
            if (t.includes('4k')) qualities.add('4K');
            else if (t.includes('1080p')) qualities.add('1080p');
            else if (t.includes('720p')) qualities.add('720p');
            else if (t.includes('480p')) qualities.add('480p');
            else qualities.add('Standard');
        }
    });

    const order = ['4K', '1080p', '720p', '480p', 'Standard'];
    const sorted = Array.from(qualities).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    setAvailableQualities(sorted);

    // Auto-select standard/reset if unavailable
    if (selectedQuality && !sorted.includes(selectedQuality)) {
        setSelectedQuality(null);
    }
  }, [data, selectedSeason, downloadType, actionType]);

  const finalSections = (() => {
      let sections = getProcessedSections();
      if (selectedQuality) {
          sections = sections.filter((sec: any) => {
              const secQ = sec.quality || (sec.title.includes('480p')?'480p':sec.title.includes('720p')?'720p':'Standard');
              return secQ === selectedQuality || sec.title.includes(selectedQuality);
          });
      }
      return sections;
  })();

  const handleLinkClick = (url: string) => {
    const payload = { 
        link: url, 
        title: data?.title, 
        poster: data?.poster, 
        quality: selectedQuality 
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

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8 text-red-600"/></div>;
  if (error) return <div className="h-screen bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-fade-in font-sans">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110" style={{ backgroundImage: `url(${data?.poster})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 py-2 px-4 rounded-full border border-white/10"><ArrowLeft size={18} /> Back</button>
        
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-[320px] flex-shrink-0 mx-auto lg:mx-0">
             <img src={data?.poster} alt={data?.title} className="rounded-2xl shadow-2xl w-full border border-white/10" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{data?.title}</h1>
            <p className="text-gray-400 text-lg mb-8 line-clamp-4">{data?.plot}</p>

            {/* SCREENSHOTS */}
            <div className="mb-8 animate-fade-in">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon className="text-blue-500"/> Screenshots</h3>
                {data?.screenshots?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.screenshots.map((src: string, i: number) => (
                            <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-800 bg-black aspect-video hover:border-blue-500/50 transition-colors">
                                <img src={src} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300" loading="lazy"/>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4"><ImageOff className="w-10 h-10 text-gray-600" /></div>
                        <h3 className="text-lg font-bold text-gray-300 mb-2">No Screenshots Available</h3>
                    </div>
                )}
            </div>

            {/* INTERACTION CARD */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
               
               {/* HEADER */}
               {(selectedSeason || actionType) && (
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                    <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><ArrowLeft size={14}/> Previous</button>
                    <div className="text-sm font-bold text-gray-500 hidden sm:block">
                        {selectedSeason ? `S${selectedSeason}` : ''} 
                        {actionType ? ` > ${actionType === 'watch' ? 'Stream' : 'DL'}` : ''}
                        {downloadType ? ` > ${downloadType}` : ''}
                        {selectedQuality ? ` > ${selectedQuality}` : ''}
                    </div>
                 </div>
               )}

               {/* 1. SEASON (Only if Series) */}
               {availableSeasons.length > 0 && selectedSeason === null && (
                  <div className="animate-fade-in">
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Film className="text-red-500" /> Select Season</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {availableSeasons.map(s => (
                              <button key={s} onClick={() => setSelectedSeason(s)} className="p-4 bg-gray-800 rounded-xl hover:bg-red-600 font-bold text-xl transition-all shadow-lg border border-gray-700">Season {s}</button>
                          ))}
                      </div>
                  </div>
               )}

               {/* 2. ACTION */}
               {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                  <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button onClick={() => setActionType('download')} className="p-8 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-2xl text-center group transition-all">
                         <HardDrive className="mx-auto mb-4 text-blue-400 group-hover:scale-110" size={48} />
                         <span className="font-bold text-2xl block text-white">Download</span>
                      </button>
                      <button onClick={() => setActionType('watch')} className="p-8 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-2xl text-center group transition-all">
                         <Play className="mx-auto mb-4 text-green-400 fill-current group-hover:scale-110" size={48} />
                         <span className="font-bold text-2xl block text-white">Watch Online</span>
                      </button>
                  </div>
               )}

               {/* 3. TYPE (Download Only & Series) */}
               {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                   <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
                       <button onClick={() => setDownloadType('episode')} className="p-8 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-2xl text-center"><Tv className="mx-auto mb-4 text-purple-400" size={48}/><span className="font-bold text-xl block text-white">Episode Wise</span></button>
                       <button onClick={() => setDownloadType('bulk')} className="p-8 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 rounded-2xl text-center"><Archive className="mx-auto mb-4 text-orange-400" size={48}/><span className="font-bold text-xl block text-white">Bulk / Zip</span></button>
                   </div>
               )}

               {/* 4. QUALITY */}
               {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                   <div className="animate-fade-in">
                       <h3 className="text-xl font-bold mb-6 text-center">Select Quality</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                           {availableQualities.length > 0 ? availableQualities.map(q => (
                               <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-blue-600 hover:border-blue-500 rounded-xl font-bold text-lg transition-all uppercase">{q}</button>
                           )) : (
                               <button onClick={() => setSelectedQuality('Standard')} className="col-span-full p-4 bg-blue-600 rounded-xl font-bold">Show All Links</button>
                           )}
                       </div>
                   </div>
               )}

               {/* 5. FINAL LINKS */}
               {selectedQuality !== null && (
                   <div className="space-y-4 animate-fade-in">
                       <h3 className="text-green-400 font-bold flex items-center gap-2 mb-4"><CheckCircle size={20}/> Available Links</h3>
                       {finalSections.length > 0 ? finalSections.map((sec: any, idx: number) => (
                           <div key={idx} className="bg-black/30 p-5 rounded-xl border border-gray-700 hover:border-blue-500/30 transition-colors">
                               <h4 className="text-blue-400 font-bold mb-4 text-sm uppercase">{sec.title}</h4>
                               <div className="flex flex-wrap gap-3">
                                   {sec.links.map((link: any, i: number) => (
                                       <button key={i} onClick={() => handleLinkClick(link.url)} className="px-5 py-3 bg-gray-800 hover:bg-blue-600 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:-translate-y-1 shadow-lg border border-white/5">
                                           {actionType === 'watch' ? <Play size={16}/> : <Download size={16}/>} {link.label}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       )) : (
                           <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-xl">No links found for {selectedQuality}.</div>
                       )}
                   </div>
               )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
