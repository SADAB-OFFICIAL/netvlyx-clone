// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, Film, CheckCircle, 
  Server, ImageIcon, Settings, CloudLightning, Archive, Tv, ImageOff
} from 'lucide-react';

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'watch' | 'download' | null>(null);
  const [downloadType, setDownloadType] = useState<'episode' | 'bulk' | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  // 1. Fetch Data
  const movieUrl = slug ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) : '';

  useEffect(() => {
    if (!movieUrl) return;
    const fetchRealData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        if (!res.ok) throw new Error("Failed");
        const result = await res.json();
        setData(result);
        
        // Detect Seasons
        const title = result.title || "";
        const sectionSeasons = new Set<number>();
        // Simple heuristic: check title for S1, S2 etc.
        const match = title.match(/Season\s*(\d+)/i);
        if (match) {
             setAvailableSeasons([parseInt(match[1])]);
        } else {
             setAvailableSeasons([]);
        }
      } catch (err) {
        setError("Content not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, [movieUrl]);

  // 2. Extract Qualities (SIMPLE LOGIC)
  useEffect(() => {
    if (!data?.downloadSections) return;
    
    const qualities = new Set<string>();
    data.downloadSections.forEach((sec: any) => {
        const title = sec.title.toLowerCase();
        if (title.includes('4k') || title.includes('2160p')) qualities.add('4K');
        else if (title.includes('1080p')) qualities.add('1080p');
        else if (title.includes('720p')) qualities.add('720p');
        else if (title.includes('480p')) qualities.add('480p');
        else qualities.add('Standard');
    });

    // Sort: 4K -> 1080p -> 720p -> 480p
    const order = ['4K', '1080p', '720p', '480p', 'Standard'];
    const sorted = Array.from(qualities).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    setAvailableQualities(sorted);
  }, [data]);

  // 3. Filter Links based on Selection
  const getFinalData = () => {
      if (!data?.downloadSections) return [];
      
      // Filter by Quality
      if (selectedQuality) {
          return data.downloadSections.filter((sec: any) => {
              // Match "720p" in "720p Links"
              return sec.title.toLowerCase().includes(selectedQuality.toLowerCase()) || 
                     (selectedQuality === 'Standard' && !sec.title.match(/\d+p/));
          });
      }
      return data.downloadSections;
  };

  const handleLinkClick = (url: string) => {
    const payload = {
        link: url,
        title: data?.title || 'Unknown',
        poster: data?.poster || '',
        quality: selectedQuality || 'Standard'
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

  const finalSections = getFinalData();

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
             <img src={data?.poster} alt={data?.title} className="rounded-2xl shadow-2xl w-full border border-white/10" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{data?.title}</h1>
            <p className="text-gray-400 text-lg mb-8 line-clamp-4">{data?.plot}</p>

            {/* SCREENSHOTS */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon className="text-blue-500"/> Screenshots</h3>
                {data?.screenshots?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.screenshots.map((src: string, i: number) => (
                            <div key={i} className="rounded-xl overflow-hidden border border-gray-800"><img src={src} className="w-full h-full object-cover" loading="lazy" /></div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center text-gray-500"><ImageOff className="mx-auto mb-2"/> No Screenshots Available</div>
                )}
            </div>

            {/* LOGIC CONTAINER */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
               
               {/* HEADER */}
               {(selectedSeason || actionType) && (
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                    <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><ArrowLeft size={14}/> Previous</button>
                    <div className="text-sm font-bold text-gray-500">Step {selectedQuality ? '4/4' : '3/4'}</div>
                 </div>
               )}

               {/* STEPS */}
               {availableSeasons.length > 0 && selectedSeason === null && (
                  <div className="grid grid-cols-2 gap-4">
                      {availableSeasons.map(s => <button key={s} onClick={() => setSelectedSeason(s)} className="p-4 bg-gray-800 rounded-xl hover:bg-red-600 font-bold text-xl transition-colors">Season {s}</button>)}
                  </div>
               )}

               {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setActionType('download')} className="p-6 bg-blue-900/30 border border-blue-500/30 rounded-xl hover:bg-blue-900/50 transition-all flex flex-col items-center gap-2"><HardDrive size={32} className="text-blue-400"/><span className="font-bold text-lg">Download</span></button>
                      <button onClick={() => setActionType('watch')} className="p-6 bg-green-900/30 border border-green-500/30 rounded-xl hover:bg-green-900/50 transition-all flex flex-col items-center gap-2"><Play size={32} className="text-green-400"/><span className="font-bold text-lg">Watch Online</span></button>
                  </div>
               )}

               {actionType && downloadType === null && actionType === 'download' && (
                   <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => setDownloadType('episode')} className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 font-bold">Episode Wise</button>
                       <button onClick={() => setDownloadType('bulk')} className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 font-bold">Bulk / Zip</button>
                   </div>
               )}

               {/* QUALITY SELECT (Now works correctly) */}
               {actionType && (actionType === 'watch' || downloadType) && selectedQuality === null && (
                   <div>
                       <h3 className="text-center mb-4 font-bold text-lg text-gray-400">Select Quality</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                           {availableQualities.length > 0 ? availableQualities.map(q => (
                               <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-blue-600 hover:border-blue-500 rounded-xl font-bold text-lg transition-all">{q}</button>
                           )) : (
                               <button onClick={() => setSelectedQuality('Standard')} className="col-span-full p-4 bg-blue-600 rounded-xl font-bold">Show Links</button>
                           )}
                       </div>
                   </div>
               )}

               {/* FINAL LINKS */}
               {selectedQuality && (
                   <div className="space-y-4 animate-fade-in">
                       <h3 className="text-green-400 font-bold flex items-center gap-2 mb-4"><CheckCircle size={20}/> Download Links ({selectedQuality})</h3>
                       {finalSections.length > 0 ? finalSections.map((sec: any, idx: number) => (
                           <div key={idx} className="bg-black/30 p-4 rounded-xl border border-gray-700">
                               <h4 className="text-blue-400 font-bold mb-3 text-sm">{sec.title}</h4>
                               <div className="flex flex-wrap gap-3">
                                   {sec.links.map((link: any, i: number) => (
                                       <button key={i} onClick={() => handleLinkClick(link.url)} className="px-4 py-2 bg-gray-800 hover:bg-blue-600 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                                           {actionType === 'watch' ? <Play size={14}/> : <Download size={14}/>} {link.label}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       )) : (
                           <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-xl">No links found for this quality.</div>
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
