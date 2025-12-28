// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, CheckCircle, 
  ImageIcon, Archive, Tv, ImageOff, Loader2, Info, Star
} from 'lucide-react';

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // TMDB States
  const [tmdbData, setTmdbData] = useState<any>(null);

  // Filters
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'watch' | 'download' | null>(null);
  const [downloadType, setDownloadType] = useState<'episode' | 'bulk' | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

  // 1. Fetch Main Data (Scraper)
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

  // 2. Fetch TMDB Data (If IMDb ID found)
  useEffect(() => {
    if (data?.imdbId && !tmdbData) {
        fetch(`/api/tmdb-details?imdb_id=${data.imdbId}`)
            .then(res => res.json())
            .then(res => {
                if (res.found) setTmdbData(res);
            })
            .catch(err => console.error("TMDB Fetch Error", err));
    }
  }, [data]);

  // Merge Data (Prefer TMDB if available)
  const finalOverview = tmdbData?.overview || data?.plot;
  const finalRating = tmdbData?.rating;
  const finalPoster = tmdbData?.poster || data?.poster; // TMDB posters are higher quality
  const finalBackdrop = tmdbData?.backdrop || data?.poster;

  // ... (Filter Logic Same as Before) ...
  const getFilteredData = () => {
      if (!data?.downloadSections) return { links: [], qualities: [] };
      let validSections = data.downloadSections.filter((sec: any) => {
          if (selectedSeason !== null && sec.season !== null && sec.season !== selectedSeason) return false;
          return true;
      });
      let allLinks: any[] = [];
      let qualSet = new Set<string>();
      validSections.forEach((sec: any) => {
          sec.links.forEach((link: any) => {
              const isBatch = link.isZip || link.label.toLowerCase().includes('zip') || link.label.toLowerCase().includes('pack') || sec.title.toLowerCase().includes('pack');
              if (actionType === 'download') {
                  if (downloadType === 'bulk' && !isBatch) return;
                  if (downloadType === 'episode' && isBatch) return;
              } else if (actionType === 'watch' && isBatch) return;
              qualSet.add(sec.quality);
              allLinks.push({ ...link, quality: sec.quality, size: sec.size, sectionTitle: sec.title });
          });
      });
      return { links: allLinks, qualities: Array.from(qualSet).sort((a,b) => ['4K','1080p','720p','480p','Standard'].indexOf(a) - ['4K','1080p','720p','480p','Standard'].indexOf(b)) };
  };

  const { links: filteredLinks, qualities: currentQualities } = getFilteredData();
  useEffect(() => { if (selectedQuality && !currentQualities.includes(selectedQuality)) setSelectedQuality(null); }, [currentQualities, selectedQuality]);
  const displayLinks = filteredLinks.filter((l: any) => !selectedQuality || l.quality === selectedQuality);

  const handleLinkClick = (url: string) => {
    const payload = { link: url, title: data?.title, poster: finalPoster, quality: selectedQuality };
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
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110" style={{ backgroundImage: `url(${finalBackdrop})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 py-2 px-4 rounded-full border border-white/10"><ArrowLeft size={18} /> Back</button>
        
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-[320px] mx-auto lg:mx-0">
              <img src={finalPoster} alt={data?.title} className="rounded-2xl shadow-2xl w-full border border-white/10" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-4">
                 <h1 className="text-3xl md:text-5xl font-bold leading-tight">{data?.title}</h1>
                 {finalRating && (
                     <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/40">
                         <Star className="w-4 h-4 text-yellow-500 fill-current"/>
                         <span className="text-yellow-500 font-bold">{finalRating}</span>
                     </div>
                 )}
            </div>
            
            {/* OVERVIEW SECTION (Updated) */}
            <div className="mb-8 bg-black/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                <h3 className="text-lg font-bold text-gray-200 mb-2 flex items-center gap-2">
                    <Info size={18} className="text-blue-500"/> Overview
                    {tmdbData && <span className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white ml-auto">TMDB Verified</span>}
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                   {finalOverview}
                </p>
            </div>

            {/* SCREENSHOTS */}
            <div className="mb-8 animate-fade-in">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon className="text-blue-500"/> Screenshots</h3>
                {data?.screenshots && data.screenshots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.screenshots.map((src: string, i: number) => (
                            <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-800 bg-black aspect-video hover:border-blue-500/50 transition-colors">
                                <img src={src} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300" loading="lazy"/>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center">
                        <ImageOff className="w-10 h-10 text-gray-600 mx-auto mb-2"/>
                        <p className="text-gray-500">No screenshots available.</p>
                    </div>
                )}
            </div>

            {/* ... (DOWNLOAD/WATCH UI - SAME AS BEFORE) ... */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
               {(selectedSeason || actionType) && (
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                    <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><ArrowLeft size={14}/> Previous</button>
                    <div className="text-sm font-bold text-gray-500 hidden sm:block">
                        {selectedSeason ? `S${selectedSeason}` : ''} {actionType ? ` > ${actionType === 'watch' ? 'Stream' : 'DL'}` : ''} {selectedQuality ? ` > ${selectedQuality}` : ''}
                    </div>
                 </div>
               )}

               {availableSeasons.length > 0 && selectedSeason === null && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
                      {availableSeasons.map(s => <button key={s} onClick={() => setSelectedSeason(s)} className="p-4 bg-gray-800 rounded-xl hover:bg-red-600 font-bold text-xl border border-gray-700 transition-all">Season {s}</button>)}
                  </div>
               )}

               {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                  <div className="grid grid-cols-2 gap-6 animate-fade-in">
                      <button onClick={() => setActionType('download')} className="p-8 bg-blue-600/20 border border-blue-500/40 rounded-2xl font-bold text-2xl text-white hover:bg-blue-600/30 transition-all">Download</button>
                      <button onClick={() => setActionType('watch')} className="p-8 bg-green-600/20 border border-green-500/40 rounded-2xl font-bold text-2xl text-white hover:bg-green-600/30 transition-all">Watch Online</button>
                  </div>
               )}

               {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                   <div className="grid grid-cols-2 gap-6 animate-fade-in">
                       <button onClick={() => setDownloadType('episode')} className="p-8 bg-gray-800 rounded-2xl font-bold text-xl hover:bg-gray-700 transition-all">Episode Wise</button>
                       <button onClick={() => setDownloadType('bulk')} className="p-8 bg-gray-800 rounded-2xl font-bold text-xl hover:bg-gray-700 transition-all">Bulk / Zip</button>
                   </div>
               )}

               {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                   <div className="animate-fade-in">
                       <h3 className="text-xl font-bold mb-6 text-center">Select Quality</h3>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                           {currentQualities.length > 0 ? currentQualities.map(q => (
                               <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-blue-600 rounded-xl font-bold text-lg transition-all">{q}</button>
                           )) : <div className="col-span-full text-center text-gray-500">No options found.</div>}
                       </div>
                   </div>
               )}

               {selectedQuality !== null && (
                   <div className="space-y-3 animate-fade-in">
                       <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><CheckCircle/> Links ({selectedQuality})</h3>
                       {displayLinks.length > 0 ? displayLinks.map((link: any, idx: number) => (
                           <button key={idx} onClick={() => handleLinkClick(link.url)} className="w-full text-left p-4 bg-black/40 hover:bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-between group transition-all">
                               <div>
                                   <span className="font-bold text-gray-200 group-hover:text-white block">{link.label}</span>
                                   <span className="text-xs text-gray-500">{link.size}</span>
                               </div>
                               {actionType === 'watch' ? <Play className="w-5 h-5 text-green-500"/> : <Download className="w-5 h-5 text-blue-500"/>}
                           </button>
                       )) : <div className="text-center py-8 text-gray-500">No links available.</div>}
                   </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
