'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, CheckCircle, 
  ImageIcon, Archive, Tv, Loader2, Star, Users 
} from 'lucide-react';

// --- ANIMATION STYLES (Inline to ensure they work without global css) ---
const animationStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
  }
`;

// --- SKELETON COMPONENT (Premium Dark Style) ---
const MovieSkeleton = () => (
  <div className="min-h-screen bg-[#050505] animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[85vh] bg-gray-900">
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col items-center justify-end space-y-6">
              <div className="h-6 w-24 bg-gray-800 rounded-full"></div> {/* Rating */}
              <div className="h-12 md:h-20 w-3/4 max-w-3xl bg-gray-800 rounded-lg"></div> {/* Title */}
              <div className="h-4 w-full max-w-2xl bg-gray-800 rounded"></div> {/* Overview Line 1 */}
              <div className="h-4 w-2/3 max-w-2xl bg-gray-800 rounded"></div> {/* Overview Line 2 */}
              <div className="flex gap-4 pt-4">
                  <div className="h-14 w-40 bg-gray-800 rounded-full"></div> {/* Button 1 */}
                  <div className="h-14 w-40 bg-gray-800 rounded-full"></div> {/* Button 2 */}
              </div>
          </div>
      </div>
      
      {/* Poster Skeleton */}
      <div className="relative z-20 -mt-16 flex justify-center mb-16">
          <div className="w-[180px] md:w-[260px] h-[270px] md:h-[390px] bg-gray-800 rounded-2xl border-4 border-[#050505] shadow-2xl"></div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-6xl mx-auto px-6 space-y-16 pb-20">
          {/* Trailer Section */}
          <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-800 rounded"></div>
              <div className="w-full aspect-video bg-gray-900 rounded-2xl border border-gray-800"></div>
          </div>
      </div>
  </div>
);

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

  // 1. FETCH MAIN DATA (Backend Scraper)
  useEffect(() => {
    if (!movieUrl) return;

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
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        if (!res.ok) throw new Error("Failed");
        const result = await res.json();
        setData(result);
        
        // Extract Seasons
        const seasonSet = new Set<number>();
        if (result.seasons) result.seasons.forEach((s: number) => seasonSet.add(s));
        if (result.downloadSections) {
             result.downloadSections.forEach((sec: any) => {
                 const m = sec.title.match(/(?:Season|S)\s*0?(\d+)/i);
                 if (m) seasonSet.add(parseInt(m[1]));
             });
        }
        if (seasonSet.size > 0) setAvailableSeasons(Array.from(seasonSet).sort((a,b)=>a-b));

      } catch (e) { 
          setError("Failed to load content");
          setLoading(false); 
      }
    };
    fetchData();
  }, [movieUrl]);

  // 2. FETCH TMDB DATA
  useEffect(() => {
    if (!data) return;
    
    let apiUrl = '';
    if (data.imdbId) {
        apiUrl = `/api/tmdb-details?imdb_id=${data.imdbId}`;
    } else if (data.title) {
        apiUrl = `/api/tmdb-details?query=${encodeURIComponent(data.title)}`;
        if (data.year) apiUrl += `&year=${data.year}`;
    }

    if (apiUrl) {
        fetch(apiUrl)
            .then(res => res.json())
            .then(res => { if (res.found) setTmdbData(res); })
            .catch(err => console.error("TMDB Error", err))
            .finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [data]);

  // Merge Data
  const finalTitle = tmdbData?.title || data?.title;
  const finalOverview = tmdbData?.overview || data?.plot;
  const finalPoster = tmdbData?.poster || data?.poster;
  const finalBackdrop = tmdbData?.backdrop || data?.poster;
  const finalRating = tmdbData?.rating;
  const trailerKey = tmdbData?.trailerKey;
  
  // 📸 FIXED: Screenshots ONLY from Scraper (Movies4u)
  // Humne TMDB ka fallback hata diya hai taaki sirf Movies4u ki original screenshots dikhein.
  const galleryImages = data?.screenshots; 

  // --- FILTER LOGIC ---
  const getFilteredData = () => {
      if (!data?.downloadSections) return { links: [], qualities: [] };

      let validSections = data.downloadSections.filter((sec: any) => {
          if (selectedSeason !== null) {
              let secSeason = sec.season;
              if (!secSeason) {
                  const m = sec.title.match(/(?:Season|S)\s*0?(\d+)/i);
                  if (m) secSeason = parseInt(m[1]);
              }
              if (secSeason !== null && secSeason !== undefined && secSeason !== selectedSeason) return false;
          }
          return true;
      });

      let allLinks: any[] = [];
      let qualSet = new Set<string>();

      validSections.forEach((sec: any) => {
          sec.links.forEach((link: any) => {
              const isBatch = (link.isZip === true) || 
                              /batch|zip|pack|complete|volume|collection/i.test(sec.title + " " + link.label);

              if (actionType === 'download') {
                  if (downloadType === 'bulk' && !isBatch) return;
                  if (downloadType === 'episode' && isBatch) return;
              } else if (actionType === 'watch' && isBatch) return;

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
              allLinks.push({ ...link, quality: q, size: sec.size || link.size, sectionTitle: sec.title });
          });
      });

      return { links: allLinks, qualities: Array.from(qualSet).sort((a,b) => ['4K','1080p','720p','480p','Standard'].indexOf(a) - ['4K','1080p','720p','480p','Standard'].indexOf(b)) };
  };

  const { links: filteredLinks, qualities: currentQualities } = getFilteredData();

  useEffect(() => { 
      if (selectedQuality && !currentQualities.includes(selectedQuality)) setSelectedQuality(null); 
  }, [currentQualities, selectedQuality]);

  const displayLinks = filteredLinks.filter((l: any) => !selectedQuality || l.quality === selectedQuality);

  const handleLinkClick = (url: string) => {
    if (!url) return;
    try {
        const safeTitle = finalTitle ? finalTitle.replace(/[^\x00-\x7F]/g, "") : "Unknown Title";
        const safePoster = finalPoster ? finalPoster : "";
        const payload = { 
            link: url, 
            title: safeTitle, 
            poster: safePoster, 
            quality: selectedQuality 
        };
        const jsonString = JSON.stringify(payload);
        const key = btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        router.push(`/vlyxdrive?key=${key}`);
    } catch (err) {
        alert("Unable to open link.");
    }
  };

  const handleHeroAction = (type: 'watch' | 'download') => {
      setActionType(type);
      setTimeout(() => {
          if (downloadRef.current) {
              downloadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      }, 50);
  };

  const goBackStep = () => {
      if (selectedQuality) setSelectedQuality(null);
      else if (downloadType) setDownloadType(null);
      else if (actionType) setActionType(null);
      else if (selectedSeason) setSelectedSeason(null);
      else router.back();
  };

  if (loading) return <MovieSkeleton />;
  if (error) return <div className="h-screen bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20 overflow-x-hidden">
      <style>{animationStyles}</style>

      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[80vh] md:h-[90vh]">
          <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${finalBackdrop})` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent"></div>
          </div>

          <div className="absolute top-6 left-6 z-50">
             <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95">
                 <ArrowLeft size={20}/> Back
             </button>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-4 text-center max-w-4xl mx-auto animate-fade-in-up">
              {finalRating && (
                  <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-3 py-1 rounded-full animate-bounce">
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

              <div className="flex gap-4 relative z-50">
                  <button 
                    onClick={() => handleHeroAction('watch')}
                    className="bg-white text-black px-8 py-3.5 rounded-full font-bold flex items-center gap-2 hover:scale-110 hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all duration-300 cursor-pointer active:scale-95"
                  >
                      <Play className="fill-current" size={20}/> Watch Now
                  </button>
                  <button 
                    onClick={() => handleHeroAction('download')}
                    className="bg-gray-800/60 backdrop-blur-md text-white px-8 py-3.5 rounded-full font-bold flex items-center gap-2 border border-white/20 hover:bg-gray-700 hover:scale-105 hover:border-white/40 transition-all duration-300 cursor-pointer active:scale-95"
                  >
                      <Download size={20}/> Download
                  </button>
              </div>
          </div>
      </div>

      {/* 2. GLOWING POSTER */}
      <div className="relative z-20 -mt-10 mb-16 flex justify-center px-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative group">
              <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110 rounded-full transition-opacity duration-500 group-hover:opacity-60 pointer-events-none" style={{ backgroundImage: `url(${finalPoster})` }}></div>
              <img src={finalPoster} alt="Poster" className="relative w-[180px] md:w-[260px] rounded-2xl shadow-2xl border-4 border-[#050505] transform transition-transform duration-500 group-hover:-translate-y-2 pointer-events-none"/>
          </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-16">
          
          {/* 3. TRAILER */}
          {trailerKey && (
              <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-red-600 pl-3">Official Trailer</h2>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black group hover:border-red-500/50 transition-colors">
                      <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${trailerKey}?rel=0&showinfo=0`} title="Trailer" allowFullScreen></iframe>
                  </div>
              </div>
          )}

          {/* 4. GALLERY (ONLY MOVIES4U SCREENSHOTS) */}
          {galleryImages && galleryImages.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-blue-600 pl-3">Screenshots</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {galleryImages.slice(0, 4).map((img: any, i: number) => {
                          const src = typeof img === 'string' ? img : `https://image.tmdb.org/t/p/w780${img.file_path}`;
                          return (
                            <div key={i} className="aspect-video rounded-xl overflow-hidden border border-gray-800 hover:scale-[1.02] hover:border-blue-500/50 transition-all duration-300">
                                <img src={src} className="w-full h-full object-cover" loading="lazy"/>
                            </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* 5. CAST & CREW */}
          {tmdbData?.cast && tmdbData.cast.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-yellow-600 pl-3"><Users size={24}/> Cast & Crew</h2>
                  <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                      {tmdbData.cast.slice(0, 10).map((actor: any, i: number) => (
                          <div key={i} className="flex-shrink-0 w-[130px] group">
                              <div className="aspect-[2/3] rounded-lg overflow-hidden border border-gray-800 bg-gray-900 mb-2 group-hover:scale-105 group-hover:border-yellow-500/50 transition-all duration-300">
                                  <img 
                                    src={actor.profile_image ? actor.profile_image : "https://via.placeholder.com/300x450?text=No+Image"} 
                                    className="w-full h-full object-cover" 
                                    loading="lazy"
                                    alt={actor.name}
                                  />
                              </div>
                              <h3 className="text-sm font-bold text-white leading-tight group-hover:text-yellow-400 transition-colors">{actor.name}</h3>
                              <p className="text-xs text-gray-400 mt-1">{actor.character}</p>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* 6. DOWNLOAD & WATCH SECTION (ANIMATED) */}
          <div id="download-section" ref={downloadRef} className="pt-10">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-white/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">Download & Watch Options</h2>

                  {/* HEADER */}
                  {(selectedSeason || actionType) && (
                     <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800 animate-fade-in-up">
                        <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-all cursor-pointer hover:-translate-x-1"><ArrowLeft size={16}/> Go Back</button>
                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">{selectedSeason ? `S${selectedSeason}` : ''} {actionType ? `/ ${actionType}` : ''} {selectedQuality ? `/ ${selectedQuality}` : ''}</div>
                     </div>
                  )}

                  {/* SEASON SELECTOR (Animated) */}
                  {availableSeasons.length > 0 && selectedSeason === null && (
                      <div className="animate-fade-in-up">
                          <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2"><Tv size={18}/> Select Season</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {availableSeasons.map(s => (
                                  <button key={s} onClick={() => setSelectedSeason(s)} className="p-4 bg-gray-800 hover:bg-red-600 hover:scale-105 border border-gray-700 hover:border-red-500 rounded-xl font-bold text-lg transition-all duration-300 cursor-pointer shadow-lg">Season {s}</button>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* ACTION SELECTOR (Animated) */}
                  {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-up max-w-2xl mx-auto">
                          <button onClick={() => setActionType('download')} className="p-8 bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-2xl hover:border-blue-400 hover:from-blue-600/30 hover:to-blue-900/30 transition-all duration-300 text-center cursor-pointer group transform hover:scale-[1.02] active:scale-95">
                             <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">Download</h3>
                          </button>
                          <button onClick={() => setActionType('watch')} className="p-8 bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-2xl hover:border-green-400 hover:from-green-600/30 hover:to-green-900/30 transition-all duration-300 text-center cursor-pointer group transform hover:scale-[1.02] active:scale-95">
                             <h3 className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">Watch Online</h3>
                          </button>
                      </div>
                  )}

                  {/* TYPE SELECTOR (Animated) */}
                  {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up max-w-2xl mx-auto">
                          <button onClick={() => setDownloadType('episode')} className="p-6 bg-gray-800 rounded-xl font-bold text-xl hover:bg-gray-700 hover:scale-105 border border-gray-700 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"><Tv size={24} className="text-purple-400"/> Episode Wise</button>
                          <button onClick={() => setDownloadType('bulk')} className="p-6 bg-gray-800 rounded-xl font-bold text-xl hover:bg-gray-700 hover:scale-105 border border-gray-700 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"><Archive size={24} className="text-orange-400"/> Bulk / Zip</button>
                      </div>
                  )}

                  {/* QUALITY SELECTOR (Animated) */}
                  {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                      <div className="animate-fade-in-up">
                          <h3 className="text-lg font-semibold text-gray-400 mb-4 text-center">Select Quality</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
                              {currentQualities.length > 0 ? currentQualities.map(q => (
                                  <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-blue-600 hover:border-blue-500 hover:scale-105 rounded-xl font-bold text-lg transition-all duration-300 cursor-pointer">{q}</button>
                              )) : <div className="col-span-full text-center text-gray-500 py-4">No options found. Try changing filters.</div>}
                          </div>
                      </div>
                  )}

                  {/* LINKS LIST (Animated) */}
                  {selectedQuality !== null && (
                      <div className="space-y-3 animate-fade-in-up max-w-3xl mx-auto">
                          <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><CheckCircle size={20}/> Available Links</h3>
                          {displayLinks.length > 0 ? displayLinks.map((link: any, idx: number) => (
                              <button key={idx} onClick={() => handleLinkClick(link.url)} className="w-full text-left p-4 bg-black/40 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-xl flex items-center justify-between group transition-all duration-300 cursor-pointer hover:translate-x-1 active:scale-[0.99]">
                                  <div>
                                      <span className="font-bold text-gray-200 group-hover:text-white block text-sm md:text-base">{link.label}</span>
                                      <div className="flex gap-2 text-xs text-gray-500 mt-1">{link.size && <span className="bg-gray-800 px-1.5 rounded">{link.size}</span>}{link.sectionTitle && <span className="text-gray-600">• {link.sectionTitle}</span>}</div>
                                  </div>
                                  {actionType === 'watch' ? <Play className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform"/> : <Download className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform"/>}
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
