// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, AlertCircle, 
  Film, CheckCircle, ImageIcon, Settings, 
  Archive, Tv, ImageOff
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

  // 1. Fetch
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
        
        // --- SEASON DETECTION ---
        const sectionSeasons = new Set<number>();
        result.downloadSections.forEach((sec: any) => {
            // Check for "Season 1", "S01" inside section titles
            const m = sec.title.match(/(?:Season|S)\s*0?(\d+)/i);
            if (m) sectionSeasons.add(parseInt(m[1]));
        });

        if (sectionSeasons.size > 0) {
          setAvailableSeasons(Array.from(sectionSeasons).sort((a,b) => a - b));
        } else {
          setAvailableSeasons([]);
        }
      } catch (err) { setError("Content not found."); } 
      finally { setLoading(false); }
    };
    fetchRealData();
  }, [movieUrl]);

  // --- 2. FILTERS ---
  const isBulkLink = (title: string, label: string) => {
    const t = (title + " " + label).toLowerCase();
    return /zip|pack|complete|batch|volume/.test(t);
  };

  const getProcessedSections = () => {
    if (!data) return [];
    
    // A. Season Filter
    let sections = data.downloadSections.filter((sec: any) => {
        if (selectedSeason === null) return true;
        // Keep section only if it matches selected season OR has no season info (common links)
        const hasSeason = /(?:Season|S)\s*0?(\d+)/i.test(sec.title);
        if (!hasSeason) return true; 
        return new RegExp(`(?:Season|S)\\s*0?${selectedSeason}`, 'i').test(sec.title);
    });

    // B. Action Filter (Watch/Download)
    sections = sections.map((sec: any) => {
        const filteredLinks = sec.links.filter((link: any) => {
            const isBulk = isBulkLink(sec.title, link.label);
            if (actionType === 'watch') return !isBulk;
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

  // --- 3. QUALITY ---
  useEffect(() => {
    if (!data) return;
    const currentSections = getProcessedSections(); 
    const qualities = new Set<string>();
    
    currentSections.forEach((sec: any) => {
        const text = sec.title.toLowerCase();
        if (text.includes('4k') || text.includes('2160p')) qualities.add('4K');
        else if (text.includes('1080p')) qualities.add('1080p');
        else if (text.includes('720p')) qualities.add('720p');
        else if (text.includes('480p')) qualities.add('480p');
    });

    if (qualities.size === 0) qualities.add("Standard");
    const order = ['4K', '1080p', '720p', '480p', 'Standard'];
    setAvailableQualities(Array.from(qualities).sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  }, [data, selectedSeason, downloadType, actionType]);

  const finalSections = (() => {
      let sections = getProcessedSections();
      if (selectedQuality && selectedQuality !== "Standard") {
          sections = sections.filter((sec: any) => 
              sec.title.toLowerCase().includes(selectedQuality.toLowerCase())
          );
      }
      return sections;
  })();

  const handleLinkClick = (url: string) => {
    const payload = { link: url, title: data?.title, poster: data?.poster, quality: selectedQuality };
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

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-fade-in font-sans">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110" style={{ backgroundImage: `url(${data?.poster})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 py-2 px-4 rounded-full border border-white/10"><ArrowLeft size={18} /> Back</button>
        
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-[320px] mx-auto lg:mx-0"><img src={data?.poster} className="rounded-2xl shadow-2xl w-full border border-white/10" /></div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{data?.title}</h1>
            <p className="text-gray-400 text-lg mb-8 line-clamp-4">{data?.plot}</p>

            <div className="mb-8 animate-fade-in">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon className="text-blue-500"/> Screenshots</h3>
                {data?.screenshots?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.screenshots.map((src: string, i: number) => (
                            <div key={i} className="rounded-xl overflow-hidden border border-gray-800"><img src={src} className="w-full h-full object-cover" /></div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center"><ImageOff className="w-10 h-10 text-gray-600 mx-auto mb-2"/> No Screenshots Available</div>
                )}
            </div>

            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
               {(selectedSeason || actionType) && (
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                    <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><ArrowLeft size={14}/> Previous</button>
                    <div className="text-sm font-bold text-gray-500">{selectedSeason ? `S${selectedSeason}` : ''} {actionType ? ` > ${actionType}` : ''}</div>
                 </div>
               )}

               {availableSeasons.length > 0 && selectedSeason === null && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {availableSeasons.map(s => <button key={s} onClick={() => setSelectedSeason(s)} className="p-4 bg-gray-800 rounded-xl hover:bg-red-600 font-bold text-xl border border-gray-700">Season {s}</button>)}
                  </div>
               )}

               {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                  <div className="grid grid-cols-2 gap-6">
                      <button onClick={() => setActionType('download')} className="p-8 bg-blue-600/20 border border-blue-500/40 rounded-2xl font-bold text-2xl">Download</button>
                      <button onClick={() => setActionType('watch')} className="p-8 bg-green-600/20 border border-green-500/40 rounded-2xl font-bold text-2xl">Watch Online</button>
                  </div>
               )}

               {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                   <div className="grid grid-cols-2 gap-6">
                       <button onClick={() => setDownloadType('episode')} className="p-8 bg-gray-800 rounded-2xl font-bold text-xl">Episode Wise</button>
                       <button onClick={() => setDownloadType('bulk')} className="p-8 bg-gray-800 rounded-2xl font-bold text-xl">Bulk / Zip</button>
                   </div>
               )}

               {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {availableQualities.map(q => <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-blue-600 rounded-xl font-bold text-lg">{q}</button>)}
                   </div>
               )}

               {selectedQuality !== null && (
                   <div className="space-y-4 animate-fade-in">
                       <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><CheckCircle/> Links</h3>
                       {finalSections.length > 0 ? finalSections.map((sec: any, idx: number) => (
                           <div key={idx} className="bg-black/30 p-5 rounded-xl border border-gray-700">
                               <h4 className="text-blue-400 font-bold mb-4 text-sm uppercase">{sec.title}</h4>
                               <div className="flex flex-wrap gap-3">
                                   {sec.links.map((link: any, i: number) => (
                                       <button key={i} onClick={() => handleLinkClick(link.url)} className="px-5 py-3 bg-gray-800 hover:bg-blue-600 rounded-lg text-sm font-bold flex items-center gap-2">
                                           {actionType === 'watch' ? <Play size={16}/> : <Download size={16}/>} {link.label}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       )) : <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-xl">No links found.</div>}
                   </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
