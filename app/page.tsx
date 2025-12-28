// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Info, Search, Bell, CloudLightning, 
  ChevronRight, Star, Loader2 
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // 1. Fetch from our secure API Route
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const init = async () => {
      try {
        const res = await fetch('/api/home');
        const result = await res.json();
        if (result.success) setData(result.data);
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Auto Slider
  useEffect(() => {
    if (!data?.hero?.length) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % data.hero.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [data]);

  // 3. Smart Link Handler
  const handleItemClick = (item: any) => {
    if (item.link) {
      // Direct Link hai (Movies4u wala) -> Go to V-Page
      const encoded = btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      router.push(`/v/${encoded}`);
    } else {
      // Link nahi hai (TMDB wala) -> Search karo
      router.push(`/search?q=${encodeURIComponent(item.title)}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
       <div className="w-16 h-16 border-4 border-red-600 rounded-full animate-spin border-t-transparent mb-4"></div>
       <p className="animate-pulse text-gray-400">Loading Library...</p>
    </div>
  );

  const activeHero = data?.hero?.[heroIndex];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500/30 pb-20">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 px-4 md:px-12 py-4 flex items-center justify-between ${scrolled ? 'bg-black/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
         <div className="flex items-center gap-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 tracking-tighter cursor-pointer flex items-center gap-1" onClick={() => window.scrollTo(0,0)}>
               <CloudLightning className="text-red-600 fill-current" size={24}/> NETVLYX
            </h1>
            <ul className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
               <li className="text-white font-bold cursor-pointer">Home</li>
               <li className="cursor-pointer hover:text-white transition">TV Shows</li>
               <li className="cursor-pointer hover:text-white transition">Movies</li>
               <li className="cursor-pointer hover:text-white transition">My List</li>
            </ul>
         </div>
         <div className="flex items-center gap-5 text-gray-300">
            <Search className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-xs text-white shadow-lg">U</div>
         </div>
      </nav>

      {/* HERO SECTION */}
      {activeHero && (
         <div className="relative w-full h-[85vh] md:h-[95vh] overflow-hidden group">
            <div className="absolute inset-0">
               <div 
                 className="w-full h-full bg-cover bg-center transition-all duration-[1500ms] transform scale-105 group-hover:scale-100"
                 style={{ backgroundImage: `url(${activeHero.poster})` }}
               ></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/10 to-transparent"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-4 md:px-12 max-w-3xl">
               <div className="flex items-center gap-3 mb-4 animate-fade-in">
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider shadow-lg">
                     TOP 10
                  </span>
                  <span className="text-green-400 font-bold text-sm flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                     <Star size={12} className="fill-current"/> {activeHero.rating}
                  </span>
               </div>

               <h1 className="text-4xl md:text-7xl font-black mb-4 leading-none drop-shadow-2xl animate-slide-up text-white">
                  {activeHero.title}
               </h1>

               <p className="text-gray-200 text-sm md:text-lg mb-8 line-clamp-3 drop-shadow-md animate-slide-up delay-100 max-w-xl leading-relaxed">
                  {activeHero.desc}
               </p>

               <div className="flex items-center gap-4 animate-slide-up delay-200">
                  <button 
                     onClick={() => handleItemClick(activeHero)}
                     className="bg-white text-black px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition-all transform hover:scale-105 shadow-xl"
                  >
                     <Play className="fill-current" size={24} /> Play
                  </button>
                  <button className="bg-gray-600/40 text-white px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-600/60 transition-all backdrop-blur-md border border-white/10">
                     <Info size={24} /> More Info
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* SECTIONS */}
      <div className="relative z-20 -mt-20 md:-mt-32 space-y-12 px-4 md:px-12">
         {data?.sections?.map((section: any, idx: number) => (
            section.items && section.items.length > 0 && (
                <div key={idx} className="space-y-4">
                   <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2 cursor-pointer group">
                      <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                      {section.title}
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center translate-y-1 group-hover:translate-y-0">
                          Explore <ChevronRight size={14}/>
                      </span>
                   </h2>
                   
                   <div className="flex gap-4 overflow-x-auto pb-8 pt-2 scrollbar-hide scroll-smooth px-1">
                      {section.items.map((item: any, i: number) => (
                         <div 
                            key={i} 
                            onClick={() => handleItemClick(item)}
                            className="group relative flex-shrink-0 w-[140px] md:w-[200px] cursor-pointer transition-all duration-300 hover:z-30 hover:scale-110 hover:-translate-y-2"
                         >
                            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg relative border border-white/5">
                               <img 
                                  src={item.image || item.poster} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:contrast-110" 
                                  loading="lazy"
                               />
                               
                               {/* Card Overlay */}
                               <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                   <div className="flex items-center gap-2 mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                       <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                                           <Play className="fill-black text-black ml-0.5" size={12}/>
                                       </div>
                                   </div>
                                   <h3 className="text-xs font-bold text-white leading-tight mb-1 line-clamp-2">
                                       {item.title}
                                   </h3>
                                   <div className="flex flex-wrap gap-1">
                                       {item.quality?.slice(0,1).map((q: string) => (
                                           <span key={q} className="text-[9px] border border-gray-500 px-1 rounded text-gray-300">{q}</span>
                                       ))}
                                   </div>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
            )
         ))}
      </div>

    </div>
  );
}
