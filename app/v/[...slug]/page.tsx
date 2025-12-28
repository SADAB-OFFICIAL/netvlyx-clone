// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, CheckCircle, 
  ImageIcon, Archive, Tv, ImageOff, Loader2
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

  const movieUrl = slug ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) : '';

  useEffect(() => {
    if (!movieUrl) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        if (!res.ok) throw new Error("Failed");
        const result = await res.json();
        setData(result);
        if (result.seasons?.length > 0) setAvailableSeasons(result.seasons);
      } catch (e) { setError("Failed to load content"); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [movieUrl]);

  // --- FILTER LOGIC ---
  const getFilteredLinks = () => {
      if (!data?.downloadSections) return [];
      let links: any[] = [];

      // Flatten all links from all sections
      data.downloadSections.forEach((sec: any) => {
          // Season Check
          if (selectedSeason !== null && sec.season !== null && sec.season !== selectedSeason) return;

          sec.links.forEach((link: any) => {
              // Quality Check from Link or Section
              const q = link.quality || sec.quality || 'Standard';
              const isZip = link.isZip || link.label.toLowerCase().includes('zip') || link.label.toLowerCase().includes('pack');

              // Type Check (Episode vs Bulk)
              if (actionType === 'download') {
                  if (downloadType === 'bulk' && !isZip) return;
                  if (downloadType === 'episode' && isZip) return;
              } else if (actionType === 'watch' && isZip) return; // No watch for zips

              // Add to list
              links.push({ ...link, quality: q, sectionTitle: sec.title });
          });
      });
      return links;
  };

  // --- QUALITY EXTRACTION ---
  useEffect(() => {
      const links = getFilteredLinks();
      const quals = new Set<string>();
      links.forEach(l => quals.add(l.quality));
      
      const order = ['4K', '1080p', '720p', '480p', 'Standard'];
      const sorted = Array.from(quals).sort((a, b) => order.indexOf(a) - order.indexOf(b));
      setAvailableQualities(sorted);

      // Auto Reset Quality
      if (selectedQuality && !sorted.includes(selectedQuality)) setSelectedQuality(null);
  }, [data, selectedSeason, downloadType, actionType]);

  // --- FINAL DISPLAY LINKS ---
  const displayLinks = getFilteredLinks().filter(l => !selectedQuality || l.quality === selectedQuality);

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

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8 text-red-600"/></div>;

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

            {/* SCREENSHOTS */}
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

            {/* ACTION CONTAINER */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
               {(selectedSeason || actionType) && (
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                    <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><ArrowLeft size={14}/> Previous</button>
                    <div className="text-sm font-bold text-gray-500 hidden sm:block">
                        {selectedSeason ? `S${selectedSeason}` : ''} 
                        {actionType ? ` > ${actionType}` : ''}
                        {selectedQuality ? ` > ${selectedQuality}` : ''}
                    </div>
                 </div>
               )}

               {/* 1. SEASON */}
               {availableSeasons.length > 0 && selectedSeason === null && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {availableSeasons.map(s => <button key={s} onClick={() => setSelectedSeason(s)} className="p-4 bg-gray-800 rounded-xl hover:bg-red-600 font-bold text-xl border border-gray-700">Season {s}</button>)}
                  </div>
               )}

               {/* 2. ACTION */}
               {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                  <div className="grid grid-cols-2 gap-6">
                      <button onClick={() => setActionType('download')} className="p-8 bg-blue-600/20 border border-blue-500/40 rounded-2xl font-bold text-2xl text-white">Download</button>
                      <button onClick={() => setActionType('watch')} className="p-8 bg-green-600/20 border border-green-500/40 rounded-2xl font-bold text-2xl text-white">Watch Online</button>
                  </div>
               )}

               {/* 3. TYPE (Download Only) */}
               {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                   <div className="grid grid-cols-2 gap-6">
                       <button onClick={() => setDownloadType('episode')} className="p-8 bg-gray-800 rounded-2xl font-bold text-xl hover:bg-gray-700">Episode Wise</button>
                       <button onClick={() => setDownloadType('bulk')} className="p-8 bg-gray-800 rounded-2xl font-bold text-xl hover:bg-gray-700">Bulk / Zip</button>
                   </div>
               )}

               {/* 4. QUALITY */}
               {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {availableQualities.length > 0 ? availableQualities.map(q => (
                           <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-blue-600 rounded-xl font-bold text-lg">{q}</button>
                       )) : <div className="col-span-full text-center text-gray-500">No options found. Try changing filters.</div>}
                   </div>
               )}

               {/* 5. LINKS */}
               {selectedQuality !== null && (
                   <div className="space-y-3 animate-fade-in">
                       <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><CheckCircle/> Links</h3>
                       {displayLinks.length > 0 ? displayLinks.map((link: any, idx: number) => (
                           <button key={idx} onClick={() => handleLinkClick(link.url)} className="w-full text-left p-4 bg-black/40 hover:bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-between group transition-all">
                               <span className="font-semibold text-sm md:text-base text-gray-200 group-hover:text-white">{link.label}</span>
                               {actionType === 'watch' ? <Play className="w-5 h-5 text-green-500"/> : <Download className="w-5 h-5 text-blue-500"/>}
                           </button>
                       )) : <div className="text-center py-8 text-gray-500">No links available for this selection.</div>}
                   </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
