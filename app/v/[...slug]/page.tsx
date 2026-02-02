'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, CheckCircle, 
  Archive, Tv, Loader2, Star, Users, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';

// --- 🌟 ULTRA-VISIBLE AMBIENT BACKGROUND 🌟 ---
const AmbientBackground = ({ image }: { image: string }) => {
  const bgImage = image; 

  if (!bgImage) return <div className="fixed inset-0 bg-[#050505]" />;

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
      
      {/* 1. Main Color Layer (Bright & Breathing) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 w-full h-full"
      >
        <motion.div 
           animate={{ 
             scale: [1, 1.25, 1], 
             opacity: [0.5, 0.8, 0.5] // Opacity badha di hai taaki clear dikhe
           }}
           transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
           className="absolute inset-0 bg-cover bg-center"
           style={{ 
             backgroundImage: `url(${bgImage})`,
             filter: 'blur(80px) saturate(250%) contrast(110%)' // High Saturation for vivid colors
           }}
        />
      </motion.div>

      {/* 2. Texture Overlay (Optional glass noise) */}
      <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />

      {/* 3. Gradients (Content Readable banane ke liye) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/20 to-transparent" />
      
      {/* Footer Blend */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#050505] to-transparent" />
    </div>
  );
};

// --- SKELETON COMPONENT ---
const MovieSkeleton = () => (
  <div className="min-h-screen bg-[#050505] animate-pulse">
      <div className="relative w-full h-[85vh] bg-gray-900/20">
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col items-center justify-end space-y-6">
              <div className="h-6 w-24 bg-gray-800 rounded-full"></div>
              <div className="h-12 md:h-20 w-3/4 max-w-3xl bg-gray-800 rounded-lg"></div>
              <div className="h-4 w-full max-w-2xl bg-gray-800 rounded"></div>
              <div className="flex gap-4 pt-4">
                  <div className="h-14 w-40 bg-gray-800 rounded-full"></div>
                  <div className="h-14 w-40 bg-gray-800 rounded-full"></div>
              </div>
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

  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

  // 1. FETCH DATA
  useEffect(() => {
    if (!movieUrl) return;
    setData(null);
    setTmdbData(null);
    setLoading(true);

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        if (!res.ok) throw new Error("Failed");
        const result = await res.json();
        setData(result);
        
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

  // 2. FETCH TMDB (Fallback)
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

  const finalTitle = tmdbData?.title || data?.title;
  const finalOverview = tmdbData?.overview || data?.plot;
  const finalPoster = tmdbData?.poster || data?.poster;
  const finalBackdrop = tmdbData?.backdrop || data?.poster;
  const finalRating = tmdbData?.rating;
  const trailerKey = tmdbData?.trailerKey;

  // 📸 SCREENSHOT LOGIC
  const galleryImages = (data?.screenshots && data.screenshots.length > 0) 
      ? data.screenshots 
      : tmdbData?.images;

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
              const isBatch = (link.isZip === true) || /batch|zip|pack|complete|volume|collection/i.test(sec.title + " " + link.label);

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
        const payload = { link: url, title: safeTitle, poster: finalPoster || "", quality: selectedQuality };
        const key = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        router.push(`/vlyxdrive?key=${key}`);
    } catch (err) { alert("Error opening link"); }
  };

  const handleHeroAction = (type: 'watch' | 'download') => {
      setActionType(type);
      setTimeout(() => {
          downloadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
  };

  const goBackStep = () => {
      if (selectedQuality) setSelectedQuality(null);
      else if (downloadType) setDownloadType(null);
      else if (actionType) setActionType(null);
      else if (selectedSeason) setSelectedSeason(null);
      else router.back();
  };

  // --- Animation Variants ---
  const sectionVariant: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
  };

  if (loading) return <MovieSkeleton />;
  if (error) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4"/>
      <h2 className="text-xl font-bold">{error}</h2>
      <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold">Go Home</button>
    </div>
  );

  return (
    // ✨ MAIN BG TRANSPARENT SO AMBIENT SHOWS ✨
    <div className="min-h-screen bg-transparent text-white font-sans pb-20 overflow-x-hidden relative">
      
      {/* 🌟 AMBIENT BACKGROUND LAYER 🌟 */}
      <AmbientBackground image={finalPoster} />

      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[80vh] md:h-[90vh] z-10">
          <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full bg-cover bg-center opacity-30 mask-image-gradient" style={{ backgroundImage: `url(${finalBackdrop})` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90"></div>
          </div>

          <div className="absolute top-6 left-6 z-50">
             <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95 duration-200 hover:bg-white/10">
                 <ArrowLeft size={20}/> Back
             </button>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-4 text-center max-w-4xl mx-auto">
              {finalRating && (
                  <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-3 py-1 rounded-full animate-fade-in-up">
                      <Star className="w-4 h-4 text-yellow-400 fill-current"/>
                      <span className="text-yellow-400 font-bold text-sm">{finalRating} IMDb</span>
                  </div>
              )}

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 animate-slide-in">
                  {finalTitle}
              </h1>

              <p className="text-gray-300 text-sm md:text-lg mb-8 line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-md animate-fade-in delay-100">
                  {finalOverview}
              </p>

              <div className="flex gap-4 relative z-50 animate-fade-in delay-200">
                  <button 
                    onClick={() => handleHeroAction('watch')}
                    className="bg-white text-black px-8 py-3.5 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] cursor-pointer active:scale-95"
                  >
                      <Play className="fill-current" size={20}/> Watch Now
                  </button>
                  <button 
                    onClick={() => handleHeroAction('download')}
                    className="bg-white/10 backdrop-blur-md text-white px-8 py-3.5 rounded-full font-bold flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer active:scale-95 hover:shadow-lg"
                  >
                      <Download size={20}/> Download
                  </button>
              </div>
          </div>
      </div>

      {/* 2. POSTER (Floating) */}
      <div className="relative z-20 -mt-10 mb-16 flex justify-center px-4">
          <div className="relative group">
              <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 rounded-full transition-opacity duration-500 group-hover:opacity-50 pointer-events-none" style={{ backgroundImage: `url(${finalPoster})` }}></div>
              <img src={finalPoster} alt="Poster" className="relative w-[180px] md:w-[260px] rounded-2xl shadow-2xl border-4 border-white/5 transform transition-transform duration-500 group-hover:-translate-y-2 pointer-events-none"/>
          </div>
      </div>

      <div className="relative z-20 max-w-6xl mx-auto px-4 md:px-8 space-y-16">
          
          {/* 3. TRAILER */}
          {trailerKey && (
              <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-red-600 pl-3">Official Trailer</h2>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black hover:border-red-500/30 transition-all duration-300 hover:scale-[1.01]">
                      <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${trailerKey}?rel=0&showinfo=0`} title="Trailer" allowFullScreen></iframe>
                  </div>
              </div>
          )}

          {/* 4. GALLERY */}
          {galleryImages && galleryImages.length > 0 && (
              <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-blue-600 pl-3">Gallery</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {galleryImages.slice(0, 4).map((img: any, i: number) => {
                          const src = typeof img === 'string' ? img : `https://image.tmdb.org/t/p/w780${img.file_path}`;
                          return (
                            <div key={i} className="aspect-video rounded-xl overflow-hidden border border-white/10 group relative shadow-lg">
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                                <img src={src} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy"/>
                            </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* =====================================================
             5. DOWNLOAD SECTION (Glassmorphism & Fast Animation) 
             =====================================================
          */}
          <div id="download-section" ref={downloadRef} className="pt-10 pb-20">
              {/* Glass Card Container (Semi-Transparent for Ambient) */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-white/20 group">
                  
                  {/* Inner Glow Blob */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-white drop-shadow-md">Download & Watch Options</h2>

                  {/* HEADER (With fast motion) */}
                  <AnimatePresence mode="wait">
                    {(selectedSeason || actionType) && (
                       <motion.div 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         transition={{ duration: 0.2 }}
                         className="flex items-center justify-between mb-8 pb-4 border-b border-white/10"
                       >
                          <button onClick={goBackStep} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer hover:underline hover:scale-105 transform"><ArrowLeft size={16}/> Go Back</button>
                          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">{selectedSeason ? `S${selectedSeason}` : ''} {actionType ? `/ ${actionType}` : ''} {selectedQuality ? `/ ${selectedQuality}` : ''}</div>
                       </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {/* SEASON SELECTOR */}
                    {availableSeasons.length > 0 && selectedSeason === null && (
                         <motion.div 
                            key="season-selector"
                            variants={sectionVariant}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                         >
                            <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2"><Tv size={18}/> Select Season</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {availableSeasons.map(s => (
                                    <button key={s} onClick={() => setSelectedSeason(s)} className="p-4 bg-white/5 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-lg transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-lg active:scale-95 text-white">Season {s}</button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ACTION SELECTOR */}
                    {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                        <motion.div 
                            key="action-selector"
                            variants={sectionVariant}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
                        >
                            <button onClick={() => setActionType('download')} className="p-8 bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-2xl hover:border-blue-400 transition-all duration-300 text-center cursor-pointer group hover:shadow-blue-500/20 shadow-lg hover:scale-[1.02] active:scale-95">
                                <h3 className="text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-300">Download</h3>
                            </button>
                            <button onClick={() => setActionType('watch')} className="p-8 bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-2xl hover:border-green-400 transition-all duration-300 text-center cursor-pointer group hover:shadow-green-500/20 shadow-lg hover:scale-[1.02] active:scale-95">
                                <h3 className="text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-300">Watch Online</h3>
                            </button>
                        </motion.div>
                    )}

                    {/* TYPE SELECTOR */}
                    {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                        <motion.div 
                            key="type-selector"
                            variants={sectionVariant}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
                        >
                            <button onClick={() => setDownloadType('episode')} className="p-6 bg-white/5 rounded-xl font-bold text-xl hover:bg-white/15 border border-white/10 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md"><Tv size={24} className="text-purple-400"/> Episode Wise</button>
                            <button onClick={() => setDownloadType('bulk')} className="p-6 bg-white/5 rounded-xl font-bold text-xl hover:bg-white/15 border border-white/10 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md"><Archive size={24} className="text-orange-400"/> Bulk / Zip</button>
                        </motion.div>
                    )}

                    {/* QUALITY SELECTOR */}
                    {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                        <motion.div 
                            key="quality-selector"
                            variants={sectionVariant}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <h3 className="text-lg font-semibold text-gray-400 mb-4 text-center">Select Quality</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
                                {currentQualities.length > 0 ? currentQualities.map(q => (
                                    <button key={q} onClick={() => setSelectedQuality(q)} className="p-4 bg-white/5 border border-white/10 hover:bg-white/20 rounded-xl font-bold text-lg transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-md active:scale-95">{q}</button>
                                )) : <div className="col-span-full text-center text-gray-500 py-4">No options found. Try changing filters.</div>}
                            </div>
                        </motion.div>
                    )}

                    {/* LINKS LIST */}
                    {selectedQuality !== null && (
                        <motion.div 
                            key="links-list"
                            variants={sectionVariant}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-3 max-w-3xl mx-auto"
                        >
                            <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><CheckCircle size={20}/> Available Links</h3>
                            {displayLinks.length > 0 ? displayLinks.map((link: any, idx: number) => (
                                <button key={idx} onClick={() => handleLinkClick(link.url)} className="w-full text-left p-4 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group transition-all duration-200 cursor-pointer hover:border-white/20 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]">
                                    <div>
                                        <span className="font-bold text-gray-200 group-hover:text-white block text-sm md:text-base transition-colors">{link.label}</span>
                                        <div className="flex gap-2 text-xs text-gray-500 mt-1">{link.size && <span className="bg-white/10 px-1.5 rounded">{link.size}</span>}{link.sectionTitle && <span className="text-gray-400">• {link.sectionTitle}</span>}</div>
                                    </div>
                                    {actionType === 'watch' ? <Play className="w-5 h-5 text-green-500 group-hover:scale-125 transition-transform duration-300"/> : <Download className="w-5 h-5 text-blue-500 group-hover:scale-125 transition-transform duration-300"/>}
                                </button>
                            )) : <div className="text-center py-10 text-gray-500">No links available.</div>}
                        </motion.div>
                    )}
                  </AnimatePresence>
              </div>
          </div>
      </div>
      
      {/* 🚀 BUG REPORT FLOATING BUTTON (Added as requested from updated code) */}
      <button 
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-red-400/20 cursor-pointer" 
        title="Report a Bug"
      >
        <div className="w-6 h-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>
        </div>
      </button>

    </div>
  );
}
