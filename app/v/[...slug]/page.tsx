'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, Download, CheckCircle, 
  Archive, Tv, Star, AlertCircle, Share2, Loader2, User 
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
// @ts-ignore
import html2canvas from 'html2canvas';

// --- 📱 HAPTIC FEEDBACK ENGINE 📱 ---
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'light': navigator.vibrate(10); break; 
      case 'medium': navigator.vibrate(20); break; 
      case 'heavy': navigator.vibrate([30, 50, 30]); break; 
    }
  }
};

// --- AMBIENT BACKGROUND ---
const AmbientBackground = ({ image }: { image: string }) => {
  if (!image) return <div className="fixed inset-0 bg-[#050505]" />;
  const optimizedImage = image.replace('original', 'w500').replace('w780', 'w500');

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none bg-[#050505]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 w-full h-full"
      >
        <motion.div 
           animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1] }}
           transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 bg-cover bg-center will-change-transform"
           style={{ 
             backgroundImage: `url(${optimizedImage})`,
             filter: 'blur(60px) saturate(200%) brightness(0.6)' 
           }}
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-[#050505]/90" />
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
    </div>
  );
};

// --- SKELETON ---
const MovieSkeleton = () => (
  <div className="min-h-screen bg-[#050505] animate-pulse">
      <div className="relative w-full h-[85vh] bg-gray-900/20">
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col items-center justify-end space-y-6">
              <div className="h-6 w-24 bg-gray-800 rounded-full"></div>
              <div className="h-12 md:h-20 w-3/4 max-w-3xl bg-gray-800 rounded-[3rem]"></div>
              <div className="h-4 w-full max-w-2xl bg-gray-800 rounded-full"></div>
          </div>
      </div>
  </div>
);

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  const downloadRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Data States
  const [data, setData] = useState<any>(null);
  const [tmdbData, setTmdbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Share States
  const [isSharing, setIsSharing] = useState(false);
  const [base64Poster, setBase64Poster] = useState<string | null>(null);

  // Filter States
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'watch' | 'download' | null>(null);
  const [downloadType, setDownloadType] = useState<'episode' | 'bulk' | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);

  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

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

  useEffect(() => {
    if (!data) return;
    let apiUrl = '';
    if (data.imdbId) apiUrl = `/api/tmdb-details?imdb_id=${data.imdbId}`;
    else if (data.title) {
        apiUrl = `/api/tmdb-details?query=${encodeURIComponent(data.title)}`;
        if (data.year) apiUrl += `&year=${data.year}`;
    }
    if (apiUrl) {
        fetch(apiUrl)
            .then(res => res.json())
            .then(res => { if (res.found) setTmdbData(res); })
            .catch(err => console.error("TMDB Error", err))
            .finally(() => setLoading(false));
    } else setLoading(false);
  }, [data]);

  const finalTitle = tmdbData?.title || data?.title;
  const finalOverview = tmdbData?.overview || data?.plot;
  const finalPoster = tmdbData?.poster || data?.poster;
  const finalBackdrop = tmdbData?.backdrop || data?.poster;
  const finalRating = tmdbData?.rating || "N/A"; 
  const trailerKey = tmdbData?.trailerKey;

  const castList = tmdbData?.credits?.cast?.slice(0, 10) || tmdbData?.cast?.slice(0, 10) || [];
  const galleryImages = (data?.screenshots && data.screenshots.length > 0) ? data.screenshots : tmdbData?.images;

  useEffect(() => {
    if (finalPoster && !base64Poster) {
      const convertToBase64 = async () => {
        try {
          const response = await fetch(finalPoster);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => { setBase64Poster(reader.result as string); };
          reader.readAsDataURL(blob);
        } catch (err) { setBase64Poster(finalPoster); }
      };
      convertToBase64();
    }
  }, [finalPoster]);

  const handleGoldenShare = async () => {
    if (isSharing || !ticketRef.current) return;
    triggerHaptic('medium'); 
    setIsSharing(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(ticketRef.current, {
            useCORS: true, scale: 2, backgroundColor: '#050505', logging: false, allowTaint: false,
        });

        const image = canvas.toDataURL("image/jpeg", 0.9);
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], `SADABEFY_${finalTitle || 'Movie'}.jpg`, { type: "image/jpeg" });

        if (navigator.share) {
            await navigator.share({ title: finalTitle, text: `Watch ${finalTitle} on SADABEFY!`, files: [file] });
        } else {
            const link = document.createElement("a");
            link.href = image; link.download = `SADABEFY_${finalTitle || 'Movie'}.jpg`; link.click();
        }
        triggerHaptic('light'); 
    } catch (err: any) {
        triggerHaptic('heavy'); 
        alert("Share Failed: " + (err.message || "Unknown Error"));
    } finally {
        setIsSharing(false);
    }
  };

  const getFilteredData = () => {
      if (!data?.downloadSections) return { links: [], qualities: [] };
      let validSections = data.downloadSections.filter((sec: any) => {
          if (selectedSeason !== null) {
              let secSeason = sec.season || (sec.title.match(/(?:Season|S)\s*0?(\d+)/i)?.[1] ? parseInt(sec.title.match(/(?:Season|S)\s*0?(\d+)/i)[1]) : null);
              if (secSeason !== null && secSeason !== undefined && secSeason !== selectedSeason) return false;
          }
          return true;
      });

      let allLinks: any[] = [];
      let qualSet = new Set<string>();

      validSections.forEach((sec: any) => {
          sec.links.forEach((link: any) => {
              const isBatch = (link.isZip === true) || /batch|zip|pack|complete|volume|collection/i.test(sec.title + " " + link.label);
              if (actionType === 'download' && ((downloadType === 'bulk' && !isBatch) || (downloadType === 'episode' && isBatch))) return;
              if (actionType === 'watch' && isBatch) return;

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
    triggerHaptic('medium');
    try {
        const safeTitle = finalTitle ? finalTitle.replace(/[^\x00-\x7F]/g, "") : "Unknown Title";
        const payload = { link: url, title: safeTitle, poster: finalPoster || "", quality: selectedQuality };
        const key = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        router.push(`/vlyxdrive?key=${key}`);
    } catch (err) { alert("Error opening link"); }
  };

  const handleHeroAction = (type: 'watch' | 'download') => {
      triggerHaptic('medium');
      setActionType(type);
      setTimeout(() => downloadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const goBackStep = () => {
      triggerHaptic('light');
      if (selectedQuality) setSelectedQuality(null);
      else if (downloadType) setDownloadType(null);
      else if (actionType) setActionType(null);
      else if (selectedSeason) setSelectedSeason(null);
      else router.back();
  };

  // ✅ VERCEL TYPE ERROR FIX: `any` laga diya taaki strict TypeScript check fail na ho
  const springTap: any = { scale: 0.93, transition: { type: "spring", stiffness: 400, damping: 17 } };
  
  const sectionVariant: Variants = {
    hidden: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
    visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.3, type: "spring", bounce: 0.3 } },
    exit: { opacity: 0, scale: 0.95, filter: 'blur(4px)', transition: { duration: 0.2 } }
  };

  if (loading) return <MovieSkeleton />;
  if (error) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4"/>
      <h2 className="text-xl font-bold">{error}</h2>
      <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white text-black rounded-[2rem] font-bold">Go Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-white font-sans pb-20 overflow-x-hidden relative selection:bg-yellow-500/30">
      <AmbientBackground image={finalPoster} />

      {/* --- HIDDEN TICKET --- */}
      <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none opacity-0" style={{ zIndex: -50 }}>
         <div ref={ticketRef} className="w-[400px] h-[700px] relative overflow-hidden flex flex-col items-center justify-between py-12 px-8" 
              style={{ backgroundColor: '#050505', border: '8px solid #ca8a04', borderRadius: '48px' }}>
             <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)' }}></div>
             {(base64Poster || finalPoster) && (
               <img src={base64Poster || finalPoster} className="absolute inset-0 w-full h-full object-cover opacity-20" style={{ filter: 'blur(20px)', transform: 'scale(1.25)' }} alt="bg"/>
             )}
             <div className="relative z-10 flex flex-col items-center w-full text-center space-y-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: '14px', borderBottom: '1px solid rgba(234, 179, 8, 0.3)', paddingBottom: '8px' }}>
                    <Star size={14} fill="#eab308"/> Premium Access
                </div>
                {(base64Poster || finalPoster) && (
                  <img src={base64Poster || finalPoster} className="w-[280px]" style={{ borderRadius: '24px', boxShadow: '0 0 40px rgba(234, 179, 8, 0.3)', border: '2px solid rgba(255,255,255,0.1)' }} alt="Poster"/>
                )}
                <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#ffffff', fontFamily: 'serif', lineHeight: '1.1' }}>{finalTitle}</h1>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '100px', fontSize: '14px', color: '#ffffff' }}>HD Quality</span>
                    <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '4px 12px', borderRadius: '100px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Star size={12} fill="#facc15"/> {finalRating}
                    </span>
                </div>
             </div>
             <div className="relative z-10 w-full text-center pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                 <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Streaming Now On</p>
                 <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#fbbf24' }}>SADABEFY</h2>
                 <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', letterSpacing: '0.1em' }}>www.sadabefy.com</p>
             </div>
         </div>
      </div>

      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[80vh] md:h-[90vh] z-10">
          <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full bg-cover bg-center opacity-40 mask-image-gradient" style={{ backgroundImage: `url(${finalBackdrop})` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#050505] to-transparent"></div>
          </div>

          <div className="absolute top-6 left-6 z-50">
             <motion.button 
                 whileTap={springTap}
                 onClick={() => { triggerHaptic('light'); router.back(); }} 
                 className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 transition-colors hover:bg-white/10 shadow-lg cursor-pointer"
             >
                 <ArrowLeft size={20}/> Back
             </motion.button>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-4 text-center max-w-4xl mx-auto">
              {finalRating && (
                  <div className="mb-4 flex items-center gap-2 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 px-4 py-1.5 rounded-full animate-fade-in-up">
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
                  <motion.button 
                    whileTap={springTap}
                    onClick={() => handleHeroAction('watch')} 
                    className="bg-white text-black px-8 py-4 rounded-[2rem] font-bold flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] cursor-pointer"
                  >
                      <Play className="fill-current" size={20}/> Watch Now
                  </motion.button>
                  <motion.button 
                    whileTap={springTap}
                    onClick={() => handleHeroAction('download')} 
                    className="bg-white/5 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] font-bold flex items-center gap-2 border border-white/10 hover:bg-white/10 transition-colors shadow-lg cursor-pointer"
                  >
                      <Download size={20}/> Download
                  </motion.button>
              </div>
          </div>
      </div>

      {/* 2. FLOATING POSTER */}
      <div className="relative z-20 -mt-10 mb-16 flex justify-center px-4">
          <div className="relative group">
              <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 rounded-[3rem] transition-opacity duration-500 group-hover:opacity-50 pointer-events-none" style={{ backgroundImage: `url(${finalPoster})` }}></div>
              <img src={finalPoster} alt="Poster" className="relative w-[180px] md:w-[260px] rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 border-white/5 transform transition-transform duration-500 group-hover:-translate-y-2 pointer-events-none"/>
          </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 md:px-8 space-y-16">
          
          {trailerKey && (
              <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 pl-3 opacity-90"><Play size={24} className="text-red-500 fill-current"/> Official Trailer</h2>
                  <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-black/50 backdrop-blur-md">
                      <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${trailerKey}?rel=0&showinfo=0`} title="Trailer" allowFullScreen></iframe>
                  </div>
              </div>
          )}

          {galleryImages && galleryImages.length > 0 && (
              <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 pl-3 opacity-90">Gallery</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {galleryImages.slice(0, 4).map((img: any, i: number) => {
                          const src = typeof img === 'string' ? img : `https://image.tmdb.org/t/p/w780${img.file_path}`;
                          return (
                            <div key={i} className="aspect-video rounded-[2rem] overflow-hidden border border-white/5 group relative shadow-lg bg-white/5 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 z-10"></div>
                                <img src={src} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy"/>
                            </div>
                          );
                      })}
                  </div>
              </div>
          )}

          <div id="download-section" ref={downloadRef} className="pt-10">
              <div className="bg-black/30 backdrop-blur-[40px] border border-white/10 rounded-[3rem] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                  
                  <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen animate-pulse"></div>
                  <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-white drop-shadow-md relative z-10">Select Option</h2>

                  <AnimatePresence mode="wait">
                    {(selectedSeason || actionType) && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 relative z-10">
                          <motion.button whileTap={springTap} onClick={goBackStep} className="cursor-pointer text-sm bg-white/5 px-4 py-2 rounded-full text-gray-300 hover:text-white flex items-center gap-1 transition-colors"><ArrowLeft size={16}/> Go Back</motion.button>
                          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full bg-black/20 border border-white/5">{selectedSeason ? `S${selectedSeason}` : ''} {actionType ? `/ ${actionType}` : ''} {selectedQuality ? `/ ${selectedQuality}` : ''}</div>
                       </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {availableSeasons.length > 0 && selectedSeason === null && (
                         <motion.div key="season-selector" variants={sectionVariant} initial="hidden" animate="visible" exit="exit" className="relative z-10">
                            <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center justify-center gap-2"><Tv size={18}/> Select Season</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {availableSeasons.map(s => (
                                    <motion.button 
                                      whileTap={springTap} 
                                      key={s} 
                                      onClick={() => { triggerHaptic('light'); setSelectedSeason(s); }} 
                                      className="cursor-pointer p-5 bg-white/5 hover:bg-white/15 border border-white/5 rounded-[2rem] font-bold text-lg transition-colors text-white text-center"
                                    >
                                        Season {s}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {((availableSeasons.length === 0) || selectedSeason !== null) && actionType === null && (
                        <motion.div key="action-selector" variants={sectionVariant} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto relative z-10">
                            <motion.button whileTap={springTap} onClick={() => { triggerHaptic('medium'); setActionType('download'); }} className="cursor-pointer p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-center group">
                                <Download size={32} className="mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300"/>
                                <h3 className="text-2xl font-bold text-white">Download</h3>
                            </motion.button>
                            <motion.button whileTap={springTap} onClick={() => { triggerHaptic('medium'); setActionType('watch'); }} className="cursor-pointer p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-green-600/10 hover:border-green-500/30 transition-all text-center group">
                                <Play size={32} className="mx-auto mb-4 text-green-400 group-hover:scale-110 transition-transform duration-300"/>
                                <h3 className="text-2xl font-bold text-white">Watch Online</h3>
                            </motion.button>
                        </motion.div>
                    )}

                    {actionType === 'download' && downloadType === null && availableSeasons.length > 0 && (
                        <motion.div key="type-selector" variants={sectionVariant} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto relative z-10">
                            <motion.button whileTap={springTap} onClick={() => { triggerHaptic('light'); setDownloadType('episode'); }} className="cursor-pointer p-6 bg-white/5 rounded-[2.5rem] font-bold text-xl hover:bg-white/10 border border-white/5 transition-colors flex flex-col items-center justify-center gap-3"><Tv size={28} className="text-purple-400"/> Episode Wise</motion.button>
                            <motion.button whileTap={springTap} onClick={() => { triggerHaptic('light'); setDownloadType('bulk'); }} className="cursor-pointer p-6 bg-white/5 rounded-[2.5rem] font-bold text-xl hover:bg-white/10 border border-white/5 transition-colors flex flex-col items-center justify-center gap-3"><Archive size={28} className="text-orange-400"/> Bulk / Zip</motion.button>
                        </motion.div>
                    )}

                    {((actionType === 'watch') || (actionType === 'download' && (availableSeasons.length === 0 || downloadType !== null))) && selectedQuality === null && (
                        <motion.div key="quality-selector" variants={sectionVariant} initial="hidden" animate="visible" exit="exit" className="relative z-10">
                            <h3 className="text-lg font-semibold text-gray-400 mb-4 text-center">Select Quality</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                                {currentQualities.length > 0 ? currentQualities.map(q => (
                                    <motion.button whileTap={springTap} key={q} onClick={() => { triggerHaptic('light'); setSelectedQuality(q); }} className="cursor-pointer p-4 bg-white/5 border border-white/5 hover:bg-white/15 rounded-[2rem] font-bold text-lg transition-colors">{q}</motion.button>
                                )) : <div className="col-span-full text-center text-gray-500 py-4">No options found.</div>}
                            </div>
                        </motion.div>
                    )}

                    {selectedQuality !== null && (
                        <motion.div key="links-list" variants={sectionVariant} initial="hidden" animate="visible" exit="exit" className="space-y-3 max-w-3xl mx-auto relative z-10">
                            <h3 className="text-green-400 font-bold mb-4 flex items-center justify-center gap-2"><CheckCircle size={20}/> Available Links</h3>
                            {displayLinks.length > 0 ? displayLinks.map((link: any, idx: number) => (
                                <motion.button 
                                  whileTap={springTap}
                                  key={idx} 
                                  onClick={() => handleLinkClick(link.url)} 
                                  className="cursor-pointer w-full text-left p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[2rem] flex items-center justify-between group transition-colors"
                                >
                                    <div>
                                        <span className="font-bold text-gray-200 group-hover:text-white block text-sm md:text-base">{link.label}</span>
                                        <div className="flex gap-2 text-xs text-gray-500 mt-1">{link.size && <span className="bg-black/30 px-2 py-0.5 rounded-full">{link.size}</span>}{link.sectionTitle && <span className="text-gray-400">• {link.sectionTitle}</span>}</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                       {actionType === 'watch' ? <Play className="w-4 h-4 text-green-400 fill-current ml-1"/> : <Download className="w-4 h-4 text-blue-400"/>}
                                    </div>
                                </motion.button>
                            )) : <div className="text-center py-10 text-gray-500 bg-white/5 rounded-[2rem] border border-white/5">No links available for this selection.</div>}
                        </motion.div>
                    )}
                  </AnimatePresence>
              </div>
          </div>
          
          {castList.length > 0 && (
             <div className="pb-24">
                 <h2 className="text-2xl font-bold mb-8 pl-3 opacity-90">Top Cast</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {castList.map((actor: any, idx: number) => (
                       <div key={idx} className="group flex flex-col items-center gap-4">
                          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-white/20 shadow-lg transition-all duration-300 group-hover:scale-105 relative bg-white/5 flex items-center justify-center">
                             {actor.profile_path ? (
                               <img src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`} className="w-full h-full object-cover" alt={actor.name} loading="lazy"/>
                             ) : (
                               <User size={32} className="text-gray-600"/>
                             )}
                          </div>
                          <div className="text-center">
                             <p className="text-white/90 font-semibold text-sm">{actor.name}</p>
                             <p className="text-white/40 text-xs mt-0.5">{actor.character}</p>
                          </div>
                       </div>
                    ))}
                 </div>
             </div>
          )}

      </div>
      
      <motion.button 
        whileTap={{ scale: 0.85, borderRadius: "50px" }}
        onClick={handleGoldenShare} 
        disabled={isSharing}
        className="cursor-pointer fixed bottom-6 right-6 z-50 bg-gradient-to-r from-yellow-500 to-amber-600 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-[0_10px_30px_rgba(217,119,6,0.4)] hover:shadow-[0_10px_40px_rgba(217,119,6,0.6)] flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-wait group" 
        title="Share Golden Ticket"
      >
        {isSharing ? <Loader2 className="animate-spin text-white" size={24}/> : <Share2 className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform text-yellow-50" />}
      </motion.button>

    </div>
  );
}
