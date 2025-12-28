'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, CheckCircle, 
  ImageIcon, Archive, Tv, Loader2, Star
} from 'lucide-react';

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  const downloadRef = useRef<HTMLDivElement>(null);
  
  // Data States
  const [data, setData] = useState<any>(null);
  const [tmdbData, setTmdbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'watch' | 'download' | null>(null);
  const [downloadType, setDownloadType] = useState<'episode' | 'bulk' | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);

  // Decode URL
  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

  // 1. FETCH MAIN DATA (With State Reset)
  useEffect(() => {
    if (!movieUrl) return;

    // Reset UI to prevent "Same UI" issue
    setData(null);
    setTmdbData(null);
    setSelectedSeason(null);
    setActionType(null);
    setDownloadType(null);
    setSelectedQuality(null);
    setAvailableSeasons([]);
    setLoading(true);

    const fetchData = async () => {
      try {
        // Call Backend (Manual Scraper with Smart Title)
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        if (!res.ok) throw new Error("Failed");
        const result = await res.json();
        setData(result);
        
        // Extract Seasons (Robust)
        const seasonSet = new Set<number>();
        if (result.seasons) result.seasons.forEach((s: number) => seasonSet.add(s));
        if (result.downloadSections) {
             result.downloadSections.forEach((sec: any) => {
                 const m = sec.title.match(/(?:Season|S)\s*0?(\d+)/i);
                 if (m) seasonSet.add(parseInt(m[1]));
             });
        }
        if (seasonSet.size > 0) setAvailableSeasons(Array.from(seasonSet).sort((a,b)=>a-b));

      } catch (e) { setError("Failed to load content"); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [movieUrl]);

  // 2. FETCH TMDB DATA (ID or Title Fallback)
  useEffect(() => {
    if (!data) return;
    
    // Logic: Try ID first, then Title
    let apiUrl = '';
    if (data.imdbId) apiUrl = `/api/tmdb-details?imdb_id=${data.imdbId}`;
    else if (data.title) apiUrl = `/api/tmdb-details?query=${encodeURIComponent(data.title)}`;

    if (apiUrl) {
        fetch(apiUrl)
            .then(res => res.json())
            .then(res => { if (res.found) setTmdbData(res); })
            .catch(err => console.error("TMDB Error", err));
    }
  }, [data]);

  // Merge Data Sources
  const finalTitle = tmdbData?.title || data?.title;
  const finalOverview = tmdbData?.overview || data?.plot;
  const finalPoster = tmdbData?.poster || data?.poster;
  const finalBackdrop = tmdbData?.backdrop || data?.poster;
  const finalRating = tmdbData?.rating;
  const trailerKey = tmdbData?.trailerKey;

  // --- FIX: PRIORITIZE SCRAPER SCREENSHOTS ---
  // Agar scraper se screenshots mile hain to wahi use karo, nahi to TMDB ke (fallback)
  const galleryImages = (data?.screenshots && data.screenshots.length > 0) ? data.screenshots : tmdbData?.images;

  // --- FILTER LOGIC (Robust) ---
  const getFilteredData = () => {
      if (!data?.downloadSections) return { links: [], qualities: [] };

      // 1. Filter by Season
      let validSections = data.downloadSections.filter((sec: any) => {
          if (selectedSeason !== null) {
              let secSeason = sec.season;
              // Double check text if season missing
              if (!secSeason) {
                  const m = sec.title.match(/(?:Season|S)\s*0?(\d+)/i);
                  if (m) secSeason = parseInt(m[1]);
              }
              // Strict Match: If section has season, it must match selected
              if (secSeason !== null && secSeason !== undefined && secSeason !== selectedSeason) return false;
          }
          return true;
      });

      let allLinks: any[] = [];
      let qualSet = new Set<string>();

      validSections.forEach((sec: any) => {
          sec.links.forEach((link: any) => {
              // 2. Identify Batch/Zip
              const isBatch = (link.isZip === true) || 
                              /batch|zip|pack|complete|volume|collection/i.test(sec.title + " " + link.label);

              // 3. Filter Action (Watch/Download)
              if (actionType === 'download') {
                  if (downloadType === 'bulk' && !isBatch) return;
                  if (downloadType === 'episode' && isBatch) return;
              } else if (actionType === 'watch' && isBatch) return;

              // 4. Identify Quality
              let q = sec.quality;
              if (!q || q === 'Standard') {
                  const t = (sec.title + " " + link.label).toLowerCase();
                  if (t.includes('4k') || t.includes('2160p')) q = '4K';
                  else if (t.includes('1080p')) q = '1080p';
                  else if (t.includes('720p')) q = '720p';
                  else if (t.includes('480p')) q = '480p';
                  else q = 'Standard';
              }
              
              qualSet.add(q);
              allLinks.push({ 
                  ...link, 
                  quality: q, 
                  size: sec.size || link.size, 
                  sectionTitle: sec.title 
              });
          });
      });

      return {
          links: allLinks,
          qualities: Array.from(qualSet).sort((a,b) => ['4K','1080p','720p','480p','Standard'].indexOf(a) - ['4K','1080p','720p','480p','Standard'].indexOf(b))
      };
  };

  const { links: filteredLinks, qualities: currentQualities } = getFilteredData();

  // Auto-reset quality if invalid
  useEffect(() => { 
      if (selectedQuality && !currentQualities.includes(selectedQuality)) setSelectedQuality(null); 
  }, [currentQualities, selectedQuality]);

  const displayLinks = filteredLinks.filter((l: any) => !selectedQuality || l.quality === selectedQuality);

  // Navigation Handlers
  const handleLinkClick = (url: string) => {
    const payload = { link: url, title: finalTitle, poster: finalPoster, quality: selectedQuality };
    const key = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/vlyxdrive?key=${key}`);
  };

  const scrollToDownloads = () => {
      downloadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHeroAction = (type: 'watch' | 'download') => {
      setActionType(type);
      setTimeout(() => scrollToDownloads(), 100);
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
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20 overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[80vh] md:h-[90vh]">
          <div className="absolute inset-0">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${finalBackdrop})` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent"></div>
          </div>

          <div className="absolute top-6 left-6 z-50">
             <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-all">
                 <ArrowLeft size={20}/> Back
             </button>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-4 text-center max-w-4xl mx-auto animate-slide-up">
              {finalRating && (
                  <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400 fill-current"/>
                      <span className="text-yellow-400 font-bold text-sm">{finalRating} IMDb</span>
                  </div>
              )}

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                  {finalTitle}
              </h1>

              <p className="text-gray-300 text-sm md:text-lg mb-8 line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-md">
                  {finalOverview}
              </p>

              <div className="flex gap-4">
                  <button onClick={() => handleHeroAction('watch')} className="bg-white text-black px-8 py-3.5 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      <Play className="fill-current" size={20}/> Watch Now
                  </button>
                  <button onClick={() => handleHeroAction('download')} className="bg-gray-800/60 backdrop-blur-md text-white px-8 py-3.5 rounded-full font-bold flex items-center gap-2 border border-white/20 hover:bg-gray-800 transition-colors">
                      <Download size={20}/> Download
                  </button>
              </div>
          </div>
      </div>

      {/* 2. GLOWING POSTER */}
      <div className="relative z-20 -mt-10 mb-16 flex justify-center px-4">
          <div className="relative group">
              <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110 rounded-full transition-opacity duration-500 group-hover:opacity-60" style={{ backgroundImage: `url(${finalPoster})` }}></div>
              <img src={finalPoster} alt="Poster" className="relative w-[180px] md:w-[260px] rounded-2xl shadow-2xl border-4 border-[#050505] transform transition-transform duration-500 group-hover:-translate-y-2"/>
          </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-16">
          
          {/* 3. TRAILER */}
          {trailerKey && (
              <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-red-600 pl-3">Official Trailer</h2>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
                      <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${trailerKey}?rel=0&showinfo=0`} title="Trailer" allowFullScreen></iframe>
                  </div>
              </div>
          )}

          {/* 4. GALLERY (From Source Website) */}
          {galleryImages && galleryImages.length > 0 && (
              <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-blue-600 pl-3">Gallery</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {galleryImages.slice(0, 4).map((img: any, i: number) => {
                          // Agar image TMDB se hai to uska full URL banao, nahi to waisa hi rehne do
                          const src = typeof img === 'string' ? img : `https://image.tmdb.org/t/p/w780${img.file_path}`;
                          return <div key={i} className="aspect-video rounded-xl overflow-hidden border border-gray-800"><img src={src} className="w-full h-full object-cover" loading="lazy"/></div>
                      })}
                  </div>
              </div>
          )}

          {/* 5. DOWNLOAD SECTION */}
          <div id="download-section" ref={downloadRef} className="pt-10">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Download & Watch Options</h2>

                  {/* HEADER (BREADCRUMB) */}
                  {(selectedSeason || actionType) && (
                     <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
                        <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"><ArrowLeft size={16}/> Go Back</button>
                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">{selectedSeason ? `S${selectedSeason}` : ''} {actionType ? `/ ${actionType}` : ''} {selectedQuality ? `/ ${selectedQuality}` : ''}</div>
                     </div>
                  )}

                  {/* SEASON SELECTOR */}
                  {availableSeasons.length > 0 && selectedSeason === null && (
                      <div className="animate-fade-in">
                          <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2"><Tv size={18}/> Select Season</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {availableSeasons.map(s => (
                                  <button key={s} onClick={() => setSelectedSeason(s)} className="p-4 bg-gray-800 hover:bg-red-600 border border-gray-700 rounded-xl font-bold text-lg transition-all">Season {s}</button>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* ACTION SELECTOR */}
                  {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in max-w-2xl mx-auto">
                          <button onClick={() => setActionType('download')} className="p-8 bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-2xl hover:border-blue-400 transition-all text-center"><h3 className="text-2xl font-bold text-white">Download</h3></button>
                          <button onClick={() => setActionType('watch')} className="p-8 bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-2xl hover:border-green-400 transition-all text-center"><h3 className="text-2xl font-bold text-white">Watch Online</h3></button>
                      </div>
                  )}

                  {/* TYPE SELECTOR */}
                  {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in max-w-2xl mx-auto">
                          <button onClick={() => setDownloadType('episode')} className="p-6 bg-gray-800 rounded-xl font-bold text-xl hover:bg-gray-700 border border-gray-700 transition-all flex items-center justify-center gap-3"><Tv size={24} className="text-purple-400"/> Episode Wise</button>
                          <button onClick={() => setDownloadType('bulk')} className="p-6 bg-gray-800 rounded-xl font-bold text-xl hover:bg-gray-700 border border-gray-700 transition-all flex items-center justify-center gap-3"><Archive size={24} className="text-orange-400"/> Bulk / Zip</button>
                      </div>
                  )}

                  {/* QUALITY SELECTOR */}
                  {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                      <div className="animate-fade-in">
                          <h3 className="text-lg font-semibold text-gray-400 mb-4 text-center">Select Quality</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
                              {currentQualities.length > 0 ? currentQualities.map(q => (
                                  <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-blue-600 rounded-xl font-bold text-lg transition-all">{q}</button>
                              )) : <div className="col-span-full text-center text-gray-500 py-4">No options found. Try changing filters.</div>}
                          </div>
                      </div>
                  )}

                  {/* LINKS LIST */}
                  {selectedQuality !== null && (
                      <div className="space-y-3 animate-fade-in max-w-3xl mx-auto">
                          <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><CheckCircle size={20}/> Available Links</h3>
                          {displayLinks.length > 0 ? displayLinks.map((link: any, idx: number) => (
                              <button key={idx} onClick={() => handleLinkClick(link.url)} className="w-full text-left p-4 bg-black/40 hover:bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-between group transition-all">
                                  <div>
                                      <span className="font-bold text-gray-200 group-hover:text-white block text-sm md:text-base">{link.label}</span>
                                      <div className="flex gap-2 text-xs text-gray-500 mt-1">{link.size && <span className="bg-gray-800 px-1.5 rounded">{link.size}</span>}{link.sectionTitle && <span className="text-gray-600">• {link.sectionTitle}</span>}</div>
                                  </div>
                                  {actionType === 'watch' ? <Play className="w-5 h-5 text-green-500"/> : <Download className="w-5 h-5 text-blue-500"/>}
                              </button>
                          )) : <div className="text-center py-10 text-gray-500">No links available.</div>}
                      </div>
                  )}

              </div>
          </div>
      </div>
    </div>
  );
}
